import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Perm } from '../common/decorators/permissions.decorator';
import { FulfillDto, OrderQueryDto } from '../common/dto/order.dto';
import { CreateSalesDto } from './dto/sales.dto';
import { SalesService } from './sales.service';

@Controller('sales-orders')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Get()
  @Perm(PERMISSIONS.SALES_READ)
  list(@Query() q: OrderQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Perm(PERMISSIONS.SALES_READ)
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Perm(PERMISSIONS.SALES_WRITE)
  create(@Body() dto: CreateSalesDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  @Perm(PERMISSIONS.SALES_WRITE)
  update(@Param('id') id: string, @Body() dto: CreateSalesDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/confirm')
  @Perm(PERMISSIONS.SALES_CONFIRM)
  confirm(@Param('id') id: string) {
    return this.service.confirm(id);
  }

  @Post(':id/cancel')
  @Perm(PERMISSIONS.SALES_WRITE)
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
