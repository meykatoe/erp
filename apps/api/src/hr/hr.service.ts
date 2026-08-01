import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ACCOUNT } from '../accounting/account-codes';
import { AccountingService, PostLine } from '../accounting/accounting.service';
import { D, sum } from '../common/utils/money';
import { pageArgs, toPage } from '../common/utils/paginate';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SequenceService } from '../sequence/sequence.service';
import {
  CreateEmployeeDto,
  CreateLeaveDto,
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

  async employees(q: PageQueryDto & { departmentId?: string }) {
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
}
