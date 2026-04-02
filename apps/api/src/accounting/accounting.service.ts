import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountType, Prisma } from '@prisma/client';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { D, Num, round2, sum, ZERO } from '../common/utils/money';
import { pageArgs, toPage } from '../common/utils/paginate';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../sequence/sequence.service';

export interface PostLine {
  code: string;
  debit?: Num;
  credit?: Num;
  memo?: string;
}

export interface PostInput {
  date?: Date;
  memo?: string;
  source?: string;
  sourceId?: string;
  createdBy?: string;
  lines: PostLine[];
}

export function assertBalanced(lines: PostLine[]) {
  if (lines.length < 2) throw new BadRequestException('分錄至少需要兩筆明細');
  const debit = sum(lines.map((l) => l.debit ?? 0));
  const credit = sum(lines.map((l) => l.credit ?? 0));
  if (!debit.eq(credit)) {
    throw new BadRequestException(`借貸不平衡: 借 ${debit} / 貸 ${credit}`);
  }
  if (debit.lte(0)) throw new BadRequestException('分錄金額必須大於 0');
  for (const l of lines) {
    if (D(l.debit ?? 0).gt(0) && D(l.credit ?? 0).gt(0)) {
      throw new BadRequestException('同一明細不可同時有借方與貸方');
    }
  }
}

type Tx = Prisma.TransactionClient;

@Injectable()
export class AccountingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seq: SequenceService,
  ) {}

  async post(tx: Tx, input: PostInput) {
    assertBalanced(input.lines);
    const codes = [...new Set(input.lines.map((l) => l.code))];
    const accounts = await tx.account.findMany({ where: { code: { in: codes } } });
    const byCode = new Map(accounts.map((a) => [a.code, a.id]));
    for (const c of codes) {
      if (!byCode.has(c)) throw new BadRequestException(`會計科目不存在: ${c}`);
    }
    const no = await this.seq.next('JV', tx, input.date);
    return tx.journalEntry.create({
      data: {
        no,
        date: input.date ?? new Date(),
        memo: input.memo,
        source: input.source,
        sourceId: input.sourceId,
        createdBy: input.createdBy,
        lines: {
          create: input.lines.map((l) => ({
            accountId: byCode.get(l.code)!,
            debit: round2(l.debit ?? 0),
            credit: round2(l.credit ?? 0),
            memo: l.memo,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async createInvoice(
    tx: Tx,
    data: {
      kind: 'AR' | 'AP';
      partyId: string;
      amount: Num;
      termDays: number;
      source: string;
      sourceId: string;
    },
  ) {
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + data.termDays * 86_400_000);
    return tx.invoice.create({
      data: {
        no: await this.seq.next(data.kind === 'AR' ? 'INV' : 'BIL', tx),
        kind: data.kind,
        customerId: data.kind === 'AR' ? data.partyId : undefined,
        supplierId: data.kind === 'AP' ? data.partyId : undefined,
        amount: round2(data.amount),
        issueDate,
        dueDate,
        source: data.source,
        sourceId: data.sourceId,
      },
    });
  }

  listAccounts() {
    return this.prisma.account.findMany({ orderBy: { code: 'asc' } });
  }

  createAccount(data: { code: string; name: string; type: AccountType; parentId?: string }) {
    return this.prisma.account.create({ data });
  }

  updateAccount(id: string, data: { name?: string; active?: boolean }) {
    return this.prisma.account.update({ where: { id }, data });
  }

  async listJournals(q: PageQueryDto) {
    const where: Prisma.JournalEntryWhereInput = q.keyword
      ? {
          OR: [
            { no: { contains: q.keyword, mode: 'insensitive' } },
            { memo: { contains: q.keyword, mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        ...pageArgs(q),
        orderBy: { createdAt: 'desc' },
        include: { lines: { include: { account: { select: { code: true, name: true } } } } },
      }),
      this.prisma.journalEntry.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  createManualJournal(input: PostInput) {
    return this.prisma.$transaction((tx) => this.post(tx, { ...input, source: 'MANUAL' }));
  }

  async reverseJournal(id: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.findUniqueOrThrow({
        where: { id },
        include: { lines: { include: { account: true } } },
      });
      if (entry.status === 'REVERSED') throw new BadRequestException('此分錄已沖銷');
      await tx.journalEntry.update({ where: { id }, data: { status: 'REVERSED' } });
      return this.post(tx, {
        memo: `沖銷 ${entry.no}`,
        source: 'REVERSAL',
        sourceId: entry.id,
        createdBy: userId,
        lines: entry.lines.map((l) => ({
          code: l.account.code,
          debit: l.credit,
          credit: l.debit,
        })),
      });
    });
  }
}
