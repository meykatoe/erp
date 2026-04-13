import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PageQueryDto } from '../../common/dto/page-query.dto';

export class StockQueryDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lowStock?: boolean;
}

export class AdjustDto {
  @IsString()
  productId!: string;

  @IsString()
  warehouseId!: string;

  @IsNumber()
  @Min(0)
  countedQty!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
