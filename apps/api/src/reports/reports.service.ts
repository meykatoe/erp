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
}
