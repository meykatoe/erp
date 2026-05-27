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
}
