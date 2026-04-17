import { BadRequestException, Injectable } from '@nestjs/common';
import { MovementType, Prisma } from '@prisma/client';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { D, Num, round2 } from '../common/utils/money';
import { pageArgs, toPage } from '../common/utils/paginate';
import { AccountingService } from '../accounting/accounting.service';
import { ACCOUNT } from '../accounting/account-codes';
import { PrismaService } from '../prisma/prisma.service';

const INBOUND: MovementType[] = ['PURCHASE_IN', 'ADJUST_IN', 'TRANSFER_IN'];

export const isInbound = (t: MovementType) => INBOUND.includes(t);

export interface MovementInput {
  productId: string;
  warehouseId: string;
  type: MovementType;
  quantity: Num;
  refType?: string;
  refId?: string;
  note?: string;
  createdBy?: string;
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
  ) {}

  async applyMovement(tx: Prisma.TransactionClient, m: MovementInput) {
    const qty = D(m.quantity);
    if (qty.lte(0)) throw new BadRequestException('異動數量必須大於 0');

    if (isInbound(m.type)) {
      await tx.stockLevel.upsert({
        where: { productId_warehouseId: { productId: m.productId, warehouseId: m.warehouseId } },
        create: { productId: m.productId, warehouseId: m.warehouseId, quantity: qty },
        update: { quantity: { increment: qty } },
      });
    } else {
      const res = await tx.stockLevel.updateMany({
        where: { productId: m.productId, warehouseId: m.warehouseId, quantity: { gte: qty } },
        data: { quantity: { decrement: qty } },
      });
      if (res.count === 0) {
        const p = await tx.product.findUnique({ where: { id: m.productId } });
        throw new BadRequestException(`庫存不足: ${p?.sku ?? m.productId}`);
      }
    }
    return tx.stockMovement.create({
      data: { ...m, quantity: qty },
    });
  }

  async levels(q: PageQueryDto & { warehouseId?: string; lowStock?: boolean }) {
    const where: Prisma.StockLevelWhereInput = {
      warehouseId: q.warehouseId,
      ...(q.keyword && {
        product: {
          OR: [
            { name: { contains: q.keyword, mode: 'insensitive' } },
            { sku: { contains: q.keyword, mode: 'insensitive' } },
          ],
        },
      }),
    };
    const [rows, total] = await Promise.all([
      this.prisma.stockLevel.findMany({
        where,
        ...pageArgs(q),
        orderBy: { product: { sku: 'asc' } },
        include: { product: true, warehouse: { select: { code: true, name: true } } },
      }),
      this.prisma.stockLevel.count({ where }),
    ]);
    const items = rows.map((r) => ({
      ...r,
      low: r.quantity.lte(r.product.reorderPoint),
      value: round2(r.quantity.mul(r.product.cost)),
    }));
    return toPage(q.lowStock ? items.filter((i) => i.low) : items, total, q);
  }

  async movements(q: PageQueryDto & { productId?: string; warehouseId?: string }) {
    const where: Prisma.StockMovementWhereInput = {
      productId: q.productId,
      warehouseId: q.warehouseId,
    };
    const [items, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        ...pageArgs(q),
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { sku: true, name: true } },
          warehouse: { select: { code: true, name: true } },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return toPage(items, total, q);
  }
}
