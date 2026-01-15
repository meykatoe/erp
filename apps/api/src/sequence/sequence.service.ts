import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export function formatNo(prefix: string, date: Date, n: number) {
  const ym = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `${prefix}${ym}${String(n).padStart(4, '0')}`;
}

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async next(
    prefix: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
    date = new Date(),
  ) {
    const key = formatNo(prefix, date, 0).slice(0, -4);
    const row = await tx.numberSequence.upsert({
      where: { key },
      create: { key, current: 1 },
      update: { current: { increment: 1 } },
    });
    return formatNo(prefix, date, row.current);
  }
}
