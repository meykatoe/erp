import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { EmployeeStatus, LeaveType } from '@prisma/client';
import { PageQueryDto } from '../../common/dto/page-query.dto';

export class DepartmentDto {
  @IsString()
  @MinLength(1)
  name!: string;
}

export class CreateEmployeeDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsDateString()
  hireDate!: string;

  @IsNumber()
  @Min(0)
  salary!: number;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class ClockDto {
  @IsString()
  employeeId!: string;
}

export class CreateLeaveDto {
  @IsString()
  employeeId!: string;

  @IsEnum(LeaveType)
  type!: LeaveType;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class PeriodDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: '期間格式須為 YYYY-MM' })
  period!: string;
}

export class BonusDto {
  @IsNumber()
  @Min(0)
  bonus!: number;
}

export class EmployeeQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  departmentId?: string;
}
