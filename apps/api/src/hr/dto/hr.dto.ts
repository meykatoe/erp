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
