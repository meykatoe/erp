import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Perm } from '../common/decorators/permissions.decorator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import {
  BonusDto,
  ClockDto,
  CreateEmployeeDto,
  CreateLeaveDto,
  DepartmentDto,
  PeriodDto,
  UpdateEmployeeDto,
} from './dto/hr.dto';
import { HrService } from './hr.service';

@Controller('hr')
export class HrController {
  constructor(private readonly service: HrService) {}

  @Get('departments')
  @Perm(PERMISSIONS.HR_READ)
  departments() {
    return this.service.departments();
  }

  @Post('departments')
  @Perm(PERMISSIONS.HR_WRITE)
  createDepartment(@Body() dto: DepartmentDto) {
    return this.service.createDepartment(dto.name);
  }
}
