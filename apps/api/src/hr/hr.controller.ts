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

  @Delete('departments/:id')
  @Perm(PERMISSIONS.HR_WRITE)
  removeDepartment(@Param('id') id: string) {
    return this.service.removeDepartment(id);
  }

  @Get('employees')
  @Perm(PERMISSIONS.HR_READ)
  employees(@Query() q: PageQueryDto & { departmentId?: string }) {
    return this.service.employees(q);
  }

  @Get('employees/:id')
  @Perm(PERMISSIONS.HR_READ)
  employee(@Param('id') id: string) {
    return this.service.employee(id);
  }

  @Post('employees')
  @Perm(PERMISSIONS.HR_WRITE)
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.service.createEmployee(dto);
  }

  @Patch('employees/:id')
  @Perm(PERMISSIONS.HR_WRITE)
  updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.service.updateEmployee(id, dto);
  }

  @Post('attendance/clock-in')
  @Perm(PERMISSIONS.HR_WRITE)
  clockIn(@Body() dto: ClockDto) {
    return this.service.clockIn(dto.employeeId);
  }

  @Post('attendance/clock-out')
  @Perm(PERMISSIONS.HR_WRITE)
  clockOut(@Body() dto: ClockDto) {
    return this.service.clockOut(dto.employeeId);
  }

  @Get('attendance')
  @Perm(PERMISSIONS.HR_READ)
  attendance(@Query('employeeId') employeeId?: string, @Query('month') month?: string) {
    return this.service.attendance(employeeId, month);
  }

  @Get('leaves')
  @Perm(PERMISSIONS.HR_READ)
  leaves(@Query('status') status?: string) {
    return this.service.leaves(status);
  }

  @Post('leaves')
  @Perm(PERMISSIONS.HR_WRITE)
  createLeave(@Body() dto: CreateLeaveDto) {
    return this.service.createLeave(dto);
  }
}
