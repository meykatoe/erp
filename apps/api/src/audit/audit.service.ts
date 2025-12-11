import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { pageArgs, toPage } from '../common/utils/paginate';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(data: Prisma.AuditLogUncheckedCreateInput) {
    return this.prisma.auditLog.create({ data });
  }

  async list(q: PageQueryDto) {
    const where: Prisma.AuditLogWhereInput = q.keyword
      ? { entity: { contains: q.keyword, mode: 'insensitive' } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        ...pageArgs(q),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return toPage(items, total, q);
  }
}
