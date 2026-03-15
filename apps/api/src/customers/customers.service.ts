import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { pageArgs, toPage } from '../common/utils/paginate';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: PageQueryDto) {
    const where: Prisma.CustomerWhereInput = q.keyword
      ? {
          OR: [
            { name: { contains: q.keyword, mode: 'insensitive' } },
            { code: { contains: q.keyword, mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({ where, ...pageArgs(q), orderBy: { code: 'asc' } }),
      this.prisma.customer.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.customer.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  update(id: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({ where: { id }, data: dto });
  }
}
