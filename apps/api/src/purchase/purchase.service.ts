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
}
