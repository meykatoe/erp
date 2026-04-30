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
}
