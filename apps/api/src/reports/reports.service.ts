import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { D, round2, sum } from '../common/utils/money';

export function monthStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const from = monthStart();
    const [sales, openPo, openSo, ar, ap, levels] = await Promise.all([
      this.prisma.salesOrder.aggregate({
        where: {
          orderDate: { gte: from },
          status: { in: ['CONFIRMED', 'PARTIALLY_SHIPPED', 'SHIPPED'] },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.purchaseOrder.count({
        where: { status: { in: ['DRAFT', 'APPROVED', 'PARTIALLY_RECEIVED'] } },
      }),
      this.prisma.salesOrder.count({
        where: { status: { in: ['DRAFT', 'CONFIRMED', 'PARTIALLY_SHIPPED'] } },
      }),
      this.prisma.invoice.findMany({
        where: { kind: 'AR', status: { in: ['UNPAID', 'PARTIAL'] } },
      }),
      this.prisma.invoice.findMany({
        where: { kind: 'AP', status: { in: ['UNPAID', 'PARTIAL'] } },
      }),
      this.prisma.stockLevel.findMany({ include: { product: true } }),
    ]);
    const open = (list: typeof ar) => sum(list.map((i) => i.amount.sub(i.paidAmount)));
    return {
      monthSales: sales._sum.total ?? D(0),
      monthOrders: sales._count,
      openPurchaseOrders: openPo,
      openSalesOrders: openSo,
      receivable: open(ar),
      payable: open(ap),
      lowStockCount: levels.filter((l) => l.quantity.lte(l.product.reorderPoint)).length,
      inventoryValue: round2(sum(levels.map((l) => l.quantity.mul(l.product.cost)))),
    };
  }

  async salesByMonth(months = 12) {
    const rows = await this.prisma.$queryRaw<{ month: string; total: string; orders: bigint }[]>`
      SELECT to_char(date_trunc('month', "orderDate"), 'YYYY-MM') AS month,
             SUM(total)::text AS total,
             COUNT(*) AS orders
      FROM "SalesOrder"
      WHERE status IN ('CONFIRMED', 'PARTIALLY_SHIPPED', 'SHIPPED')
        AND "orderDate" >= date_trunc('month', now()) - make_interval(months => ${months - 1})
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((r) => ({ month: r.month, total: Number(r.total), orders: Number(r.orders) }));
  }

  async topProducts(limit = 10) {
    const items = await this.prisma.salesOrderItem.groupBy({
      by: ['productId'],
      _sum: { shippedQty: true, amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });
    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map((i) => i.productId) } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    return items.map((i) => ({
      sku: byId.get(i.productId)?.sku,
      name: byId.get(i.productId)?.name,
      quantity: i._sum.shippedQty,
      amount: i._sum.amount,
    }));
  }

  async inventoryValuation() {
    const levels = await this.prisma.stockLevel.findMany({
      include: { product: true, warehouse: true },
    });
    const byWarehouse = new Map<
      string,
      { code: string; name: string; value: ReturnType<typeof D> }
    >();
    for (const l of levels) {
      const row = byWarehouse.get(l.warehouseId) ?? {
        code: l.warehouse.code,
        name: l.warehouse.name,
        value: D(0),
      };
      row.value = row.value.add(l.quantity.mul(l.product.cost));
      byWarehouse.set(l.warehouseId, row);
    }
    const rows = [...byWarehouse.values()].map((r) => ({ ...r, value: round2(r.value) }));
    return { rows, total: round2(sum(rows.map((r) => r.value))) };
  }

  async incomeStatement(from?: Date, to?: Date) {
    const lines = await this.prisma.journalLine.findMany({
      where: {
        entry: { status: 'POSTED', date: { gte: from, lte: to } },
        account: { type: { in: ['REVENUE', 'EXPENSE'] } },
      },
      include: { account: true },
    });
    const acc = new Map<
      string,
      { code: string; name: string; type: string; amount: ReturnType<typeof D> }
    >();
    for (const l of lines) {
      const sign = l.account.type === 'REVENUE' ? l.credit.sub(l.debit) : l.debit.sub(l.credit);
      const row = acc.get(l.accountId) ?? {
        code: l.account.code,
        name: l.account.name,
        type: l.account.type,
        amount: D(0),
      };
      row.amount = row.amount.add(sign);
      acc.set(l.accountId, row);
    }
    const rows = [...acc.values()].sort((a, b) => a.code.localeCompare(b.code));
    const revenue = sum(rows.filter((r) => r.type === 'REVENUE').map((r) => r.amount));
    const expense = sum(rows.filter((r) => r.type === 'EXPENSE').map((r) => r.amount));
    return { rows, revenue, expense, netIncome: revenue.sub(expense) };
  }
}
