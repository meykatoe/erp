import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PageQueryDto } from './page-query.dto';

export class OrderItemDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class FulfillItemDto {
  @IsString()
  itemId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;
}
