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
}
