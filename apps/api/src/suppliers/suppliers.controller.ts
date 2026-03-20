import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { Perm } from '../common/decorators/permissions.decorator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Get()
  @Perm(PERMISSIONS.SUPPLIER_READ)
  list(@Query() q: PageQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Perm(PERMISSIONS.SUPPLIER_READ)
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Perm(PERMISSIONS.SUPPLIER_WRITE)
  create(@Body() dto: CreateSupplierDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Perm(PERMISSIONS.SUPPLIER_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.update(id, dto);
  }
}
