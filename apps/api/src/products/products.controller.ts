import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { Perm } from '../common/decorators/permissions.decorator';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './dto/product.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  @Perm(PERMISSIONS.PRODUCT_READ)
  list(@Query() q: ProductQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Perm(PERMISSIONS.PRODUCT_READ)
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Perm(PERMISSIONS.PRODUCT_WRITE)
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Perm(PERMISSIONS.PRODUCT_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }
}
