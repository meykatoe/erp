import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { pageArgs, toPage } from '../common/utils/paginate';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      categoryId: q.categoryId,
      active: q.active,
      ...(q.keyword && {
        OR: [
          { name: { contains: q.keyword, mode: 'insensitive' } },
          { sku: { contains: q.keyword, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        ...pageArgs(q),
        orderBy: { sku: 'asc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: { category: true, stocks: { include: { warehouse: true } } },
    });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  update(id: string, dto: UpdateProductDto) {
    return this.prisma.product.update({ where: { id }, data: dto });
  }
}
