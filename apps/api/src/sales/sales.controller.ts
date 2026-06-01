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
}
