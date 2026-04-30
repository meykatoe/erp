import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ACCOUNT } from '../accounting/account-codes';
import { AccountingService } from '../accounting/accounting.service';
import { FulfillDto, OrderQueryDto } from '../common/dto/order.dto';
import { D, lineAmount, movingAverage, sum } from '../common/utils/money';
import { pageArgs, toPage } from '../common/utils/paginate';
import { assertTransition } from '../common/utils/state';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../sequence/sequence.service';
import { CreatePurchaseDto } from './dto/purchase.dto';
import { PURCHASE_TRANSITIONS } from './purchase.state';

const include = {
  supplier: { select: { id: true, code: true, name: true } },
  warehouse: { select: { id: true, code: true, name: true } },
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
} satisfies Prisma.PurchaseOrderInclude;

@Injectable()
export class PurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seq: SequenceService,
    private readonly inventory: InventoryService,
    private readonly accounting: AccountingService,
  ) {}

  async list(q: OrderQueryDto) {
    const where: Prisma.PurchaseOrderWhereInput = {
      status: q.status as never,
      supplierId: q.partyId,
      orderDate: {
        gte: q.from ? new Date(q.from) : undefined,
        lte: q.to ? new Date(q.to) : undefined,
      },
      ...(q.keyword && { no: { contains: q.keyword, mode: 'insensitive' } }),
    };
    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        ...pageArgs(q),
        orderBy: { createdAt: 'desc' },
        include: { supplier: { select: { name: true } }, warehouse: { select: { name: true } } },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.purchaseOrder.findUniqueOrThrow({ where: { id }, include });
  }

  private buildItems(dto: CreatePurchaseDto) {
    const items = dto.items.map((i) => ({
      productId: i.productId,
      quantity: D(i.quantity),
      unitPrice: D(i.unitPrice),
      amount: lineAmount(i.quantity, i.unitPrice),
    }));
    return { items, total: sum(items.map((i) => i.amount)) };
  }

  create(dto: CreatePurchaseDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const { items, total } = this.buildItems(dto);
      return tx.purchaseOrder.create({
        data: {
          no: await this.seq.next('PO', tx),
          supplierId: dto.supplierId,
          warehouseId: dto.warehouseId,
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : undefined,
          note: dto.note,
          total,
          createdBy: userId,
          items: { create: items },
        },
        include,
      });
    });
  }

  async update(id: string, dto: CreatePurchaseDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUniqueOrThrow({ where: { id } });
      if (order.status !== 'DRAFT') throw new BadRequestException('只有草稿可以修改');
      const { items, total } = this.buildItems(dto);
      await tx.purchaseOrderItem.deleteMany({ where: { orderId: id } });
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: dto.supplierId,
          warehouseId: dto.warehouseId,
          expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
          note: dto.note,
          total,
          items: { create: items },
        },
        include,
      });
    });
  }

  async approve(id: string) {
    const order = await this.prisma.purchaseOrder.findUniqueOrThrow({ where: { id } });
    assertTransition(PURCHASE_TRANSITIONS, order.status, 'APPROVED', '採購單');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED' },
      include,
    });
  }

  async cancel(id: string) {
    const order = await this.prisma.purchaseOrder.findUniqueOrThrow({ where: { id } });
    assertTransition(PURCHASE_TRANSITIONS, order.status, 'CANCELLED', '採購單');
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include,
    });
  }

  receive(id: string, dto: FulfillDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "PurchaseOrder" WHERE id = ${id} FOR UPDATE`;
      const order = await tx.purchaseOrder.findUniqueOrThrow({
        where: { id },
        include: { items: true, supplier: true },
      });
      if (order.status !== 'APPROVED' && order.status !== 'PARTIALLY_RECEIVED') {
        throw new BadRequestException('採購單尚未核准或已結案');
      }

      let received = D(0);
      for (const line of dto.items) {
        const item = order.items.find((i) => i.id === line.itemId);
        if (!item) throw new BadRequestException('收貨明細不屬於此採購單');
        const qty = D(line.quantity);
        if (qty.gt(item.quantity.sub(item.receivedQty))) {
          throw new BadRequestException('收貨數量超過未收數量');
        }

        const agg = await tx.stockLevel.aggregate({
          where: { productId: item.productId },
          _sum: { quantity: true },
        });
        const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        const cost = movingAverage(agg._sum.quantity ?? 0, product.cost, qty, item.unitPrice);
        await tx.product.update({ where: { id: item.productId }, data: { cost } });

        await this.inventory.applyMovement(tx, {
          productId: item.productId,
          warehouseId: order.warehouseId,
          type: 'PURCHASE_IN',
          quantity: qty,
          refType: 'PO',
          refId: order.id,
          createdBy: userId,
        });
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty: { increment: qty } },
        });
        received = received.add(lineAmount(qty, item.unitPrice));
      }

      const fresh = await tx.purchaseOrderItem.findMany({ where: { orderId: id } });
      const done = fresh.every((i) => i.receivedQty.gte(i.quantity));
      const status = done ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
      assertTransition(PURCHASE_TRANSITIONS, order.status, status, '採購單');
      await tx.purchaseOrder.update({ where: { id }, data: { status } });

      await this.accounting.post(tx, {
        memo: `採購入庫 ${order.no}`,
        source: 'PO',
        sourceId: order.id,
        createdBy: userId,
        lines: [
          { code: ACCOUNT.INVENTORY, debit: received },
          { code: ACCOUNT.AP, credit: received },
        ],
      });
      await this.accounting.createInvoice(tx, {
        kind: 'AP',
        partyId: order.supplierId,
        amount: received,
        termDays: order.supplier.termDays,
        source: 'PO',
        sourceId: order.id,
      });
      return tx.purchaseOrder.findUniqueOrThrow({ where: { id }, include });
    });
  }
}
