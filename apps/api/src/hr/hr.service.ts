import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ACCOUNT } from '../accounting/account-codes';
import { AccountingService, PostLine } from '../accounting/accounting.service';
import { D, sum } from '../common/utils/money';
import { pageArgs, toPage } from '../common/utils/paginate';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../sequence/sequence.service';
import {
  CreateEmployeeDto,
  CreateLeaveDto,
  EmployeeQueryDto,
  UpdateEmployeeDto,
} from './dto/hr.dto';
import { calcPayroll, isLate, leaveDays } from './payroll.calc';

const day = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly seq: SequenceService,
    private readonly accounting: AccountingService,
  ) {}

  departments() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { employees: true } } },
    });
  }

  createDepartment(name: string) {
    return this.prisma.department.create({ data: { name } });
  }

  async removeDepartment(id: string) {
    const n = await this.prisma.employee.count({ where: { departmentId: id } });
    if (n > 0) throw new BadRequestException('部門仍有員工');
    await this.prisma.department.delete({ where: { id } });
    return { ok: true };
  }

  async employees(q: EmployeeQueryDto) {
    const where: Prisma.EmployeeWhereInput = {
      departmentId: q.departmentId,
      ...(q.keyword && {
        OR: [
          { name: { contains: q.keyword, mode: 'insensitive' } },
          { no: { contains: q.keyword, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        ...pageArgs(q),
        orderBy: { no: 'asc' },
        include: { department: { select: { name: true } } },
      }),
      this.prisma.employee.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  employee(id: string) {
    return this.prisma.employee.findUniqueOrThrow({
      where: { id },
      include: { department: true },
    });
  }

  async createEmployee(dto: CreateEmployeeDto) {
    return this.prisma.$transaction(async (tx) =>
      tx.employee.create({
        data: { ...dto, hireDate: new Date(dto.hireDate), no: await this.seq.next('EMP', tx) },
      }),
    );
  }

  updateEmployee(id: string, dto: UpdateEmployeeDto) {
    return this.prisma.employee.update({ where: { id }, data: dto });
  }

  async clockIn(employeeId: string, now = new Date()) {
    const date = day(now);
    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (existing?.checkIn) throw new BadRequestException('今日已打過上班卡');
    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: { employeeId, date, checkIn: now, status: isLate(now) ? 'LATE' : 'NORMAL' },
      update: { checkIn: now, status: isLate(now) ? 'LATE' : 'NORMAL' },
    });
  }

  async clockOut(employeeId: string, now = new Date()) {
    const date = day(now);
    const row = await this.prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (!row?.checkIn) throw new BadRequestException('今日尚未打上班卡');
    return this.prisma.attendance.update({ where: { id: row.id }, data: { checkOut: now } });
  }

  attendance(employeeId?: string, month?: string) {
    const start = month ? new Date(`${month}-01T00:00:00Z`) : undefined;
    const end = start
      ? new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
      : undefined;
    return this.prisma.attendance.findMany({
      where: { employeeId, date: { gte: start, lt: end } },
      orderBy: { date: 'desc' },
      include: { employee: { select: { no: true, name: true } } },
      take: 500,
    });
  }

  async createLeave(dto: CreateLeaveDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start) throw new BadRequestException('結束日不可早於開始日');
    const days = leaveDays(start, end);
    if (days === 0) throw new BadRequestException('請假區間內沒有工作日');
    return this.prisma.leaveRequest.create({
      data: { ...dto, startDate: start, endDate: end, days },
    });
  }

  leaves(status?: string) {
    return this.prisma.leaveRequest.findMany({
      where: { status: status as never },
      orderBy: { createdAt: 'desc' },
      include: { employee: { select: { no: true, name: true } } },
      take: 200,
    });
  }

  async decideLeave(id: string, approve: boolean, approverId: string) {
    const leave = await this.prisma.leaveRequest.findUniqueOrThrow({ where: { id } });
    if (leave.status !== 'PENDING') throw new BadRequestException('此申請已處理');
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: approve ? 'APPROVED' : 'REJECTED', approverId },
    });
  }

  async generatePayroll(period: string) {
    const employees = await this.prisma.employee.findMany({ where: { status: 'ACTIVE' } });
    const done = await this.prisma.payroll.findMany({ where: { period } });
    const skip = new Set(done.map((p) => p.employeeId));
    const data = employees
      .filter((e) => !skip.has(e.id))
      .map((e) => {
        const r = calcPayroll(e.salary);
        return {
          employeeId: e.id,
          period,
          base: e.salary,
          deduction: r.deduction,
          tax: r.tax,
          net: r.net,
        };
      });
    await this.prisma.payroll.createMany({ data });
    return { created: data.length, skipped: skip.size };
  }

  payrolls(period?: string) {
    return this.prisma.payroll.findMany({
      where: { period },
      orderBy: [{ period: 'desc' }, { employee: { no: 'asc' } }],
      include: { employee: { select: { no: true, name: true } } },
      take: 500,
    });
  }

  async setBonus(id: string, bonus: number) {
    const p = await this.prisma.payroll.findUniqueOrThrow({ where: { id } });
    if (p.status !== 'DRAFT') throw new BadRequestException('已發放的薪資不可修改');
    const r = calcPayroll(p.base, bonus);
    return this.prisma.payroll.update({
      where: { id },
      data: { bonus, deduction: r.deduction, tax: r.tax, net: r.net },
    });
  }

  payPayroll(period: string, userId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.payroll.findMany({ where: { period, status: 'DRAFT' } });
      if (rows.length === 0) throw new BadRequestException('沒有待發放的薪資');
      const gross = sum(rows.map((r) => r.base.add(r.bonus)));
      const net = sum(rows.map((r) => r.net));
      const withheld = gross.sub(net);
      await tx.payroll.updateMany({
        where: { period, status: 'DRAFT' },
        data: { status: 'PAID', paidAt: new Date() },
      });
      const lines: PostLine[] = [
        { code: ACCOUNT.SALARY, debit: gross },
        { code: ACCOUNT.CASH, credit: net },
      ];
      if (withheld.gt(0)) lines.push({ code: ACCOUNT.WITHHOLDING, credit: withheld });
      await this.accounting.post(tx, {
        memo: `${period} 薪資發放`,
        source: 'PAYROLL',
        sourceId: period,
        createdBy: userId,
        lines,
      });
      return { paid: rows.length, gross: D(gross), net: D(net) };
    });
  }
}
