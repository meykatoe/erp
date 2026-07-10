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
