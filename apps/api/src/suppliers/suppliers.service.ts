import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { pageArgs, toPage } from '../common/utils/paginate';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: PageQueryDto) {
    const where: Prisma.SupplierWhereInput = q.keyword
      ? {
          OR: [
            { name: { contains: q.keyword, mode: 'insensitive' } },
            { code: { contains: q.keyword, mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.supplier.findMany({ where, ...pageArgs(q), orderBy: { code: 'asc' } }),
      this.prisma.supplier.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.supplier.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: dto });
  }

  update(id: string, dto: UpdateSupplierDto) {
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }
}
