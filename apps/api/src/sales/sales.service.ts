import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ACCOUNT } from '../accounting/account-codes';
import { AccountingService, PostLine } from '../accounting/accounting.service';
import { FulfillDto, OrderQueryDto } from '../common/dto/order.dto';
import { D, lineAmount, round2, sum } from '../common/utils/money';
import { pageArgs, toPage } from '../common/utils/paginate';
import { assertTransition } from '../common/utils/state';
import { InventoryService } from '../inventory/inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../sequence/sequence.service';
import { CreateSalesDto } from './dto/sales.dto';
import { SALES_TRANSITIONS } from './sales.state';

const include = {
  customer: { select: { id: true, code: true, name: true } },
  warehouse: { select: { id: true, code: true, name: true } },
  items: { include: { product: { select: { id: true, sku: true, name: true, unit: true } } } },
} satisfies Prisma.SalesOrderInclude;

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seq: SequenceService,
    private readonly inventory: InventoryService,
    private readonly accounting: AccountingService,
  ) {}

  async list(q: OrderQueryDto) {
    const where: Prisma.SalesOrderWhereInput = {
      status: q.status as never,
      customerId: q.partyId,
      orderDate: {
        gte: q.from ? new Date(q.from) : undefined,
        lte: q.to ? new Date(q.to) : undefined,
      },
      ...(q.keyword && { no: { contains: q.keyword, mode: 'insensitive' } }),
    };
    const [items, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        ...pageArgs(q),
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } }, warehouse: { select: { name: true } } },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.salesOrder.findUniqueOrThrow({ where: { id }, include });
  }

  private buildItems(dto: CreateSalesDto) {
    const items = dto.items.map((i) => ({
      productId: i.productId,
      quantity: D(i.quantity),
      unitPrice: D(i.unitPrice),
      amount: lineAmount(i.quantity, i.unitPrice),
    }));
    return { items, total: sum(items.map((i) => i.amount)) };
  }

  create(dto: CreateSalesDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const { items, total } = this.buildItems(dto);
      return tx.salesOrder.create({
        data: {
          no: await this.seq.next('SO', tx),
          customerId: dto.customerId,
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

  update(id: string, dto: CreateSalesDto) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUniqueOrThrow({ where: { id } });
      if (order.status !== 'DRAFT') throw new BadRequestException('只有草稿可以修改');
      const { items, total } = this.buildItems(dto);
      await tx.salesOrderItem.deleteMany({ where: { orderId: id } });
      return tx.salesOrder.update({
        where: { id },
        data: {
          customerId: dto.customerId,
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

  async confirm(id: string) {
    const order = await this.prisma.salesOrder.findUniqueOrThrow({
      where: { id },
      include: { customer: true },
    });
    assertTransition(SALES_TRANSITIONS, order.status, 'CONFIRMED', '銷售單');

    const limit = order.customer.creditLimit;
    if (limit.gt(0)) {
      const open = await this.prisma.invoice.findMany({
        where: { kind: 'AR', customerId: order.customerId, status: { in: ['UNPAID', 'PARTIAL'] } },
      });
      const owed = sum(open.map((i) => i.amount.sub(i.paidAmount)));
      if (owed.add(order.total).gt(limit)) {
        throw new BadRequestException(`超過客戶信用額度 ${limit}(未收 ${owed})`);
      }
    }
    return this.prisma.salesOrder.update({ where: { id }, data: { status: 'CONFIRMED' }, include });
  }

  async cancel(id: string) {
    const order = await this.prisma.salesOrder.findUniqueOrThrow({ where: { id } });
    assertTransition(SALES_TRANSITIONS, order.status, 'CANCELLED', '銷售單');
    return this.prisma.salesOrder.update({ where: { id }, data: { status: 'CANCELLED' }, include });
  }

  ship(id: string, dto: FulfillDto, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "SalesOrder" WHERE id = ${id} FOR UPDATE`;
      const order = await tx.salesOrder.findUniqueOrThrow({
        where: { id },
        include: { items: true, customer: true },
      });
      if (order.status !== 'CONFIRMED' && order.status !== 'PARTIALLY_SHIPPED') {
        throw new BadRequestException('銷售單尚未確認或已結案');
      }

      let revenue = D(0);
      let cogs = D(0);
      for (const line of dto.items) {
        const item = order.items.find((i) => i.id === line.itemId);
        if (!item) throw new BadRequestException('出貨明細不屬於此銷售單');
        const qty = D(line.quantity);
        if (qty.gt(item.quantity.sub(item.shippedQty))) {
          throw new BadRequestException('出貨數量超過未出數量');
        }
        const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        await this.inventory.applyMovement(tx, {
          productId: item.productId,
          warehouseId: order.warehouseId,
          type: 'SALES_OUT',
          quantity: qty,
          refType: 'SO',
          refId: order.id,
          createdBy: userId,
        });
        await tx.salesOrderItem.update({
          where: { id: item.id },
          data: { shippedQty: { increment: qty } },
        });
        revenue = revenue.add(lineAmount(qty, item.unitPrice));
        cogs = cogs.add(round2(qty.mul(product.cost)));
      }

      const fresh = await tx.salesOrderItem.findMany({ where: { orderId: id } });
      const done = fresh.every((i) => i.shippedQty.gte(i.quantity));
      const status = done ? 'SHIPPED' : 'PARTIALLY_SHIPPED';
      assertTransition(SALES_TRANSITIONS, order.status, status, '銷售單');
      await tx.salesOrder.update({ where: { id }, data: { status } });

      const lines: PostLine[] = [
        { code: ACCOUNT.AR, debit: revenue },
        { code: ACCOUNT.REVENUE, credit: revenue },
      ];
      if (cogs.gt(0)) {
        lines.push({ code: ACCOUNT.COGS, debit: cogs }, { code: ACCOUNT.INVENTORY, credit: cogs });
      }
      await this.accounting.post(tx, {
        memo: `銷貨出庫 ${order.no}`,
        source: 'SO',
        sourceId: order.id,
        createdBy: userId,
        lines,
      });
      await this.accounting.createInvoice(tx, {
        kind: 'AR',
        partyId: order.customerId,
        amount: revenue,
        termDays: order.customer.termDays,
        source: 'SO',
        sourceId: order.id,
      });
      return tx.salesOrder.findUniqueOrThrow({ where: { id }, include });
    });
  }
}
