import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Perm } from '../common/decorators/permissions.decorator';
import { FulfillDto, OrderQueryDto } from '../common/dto/order.dto';
import { CreatePurchaseDto, UpdatePurchaseDto } from './dto/purchase.dto';
import { PurchaseService } from './purchase.service';

@Controller('purchase-orders')
export class PurchaseController {
  constructor(private readonly service: PurchaseService) {}

  @Get()
  @Perm(PERMISSIONS.PURCHASE_READ)
  list(@Query() q: OrderQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Perm(PERMISSIONS.PURCHASE_READ)
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Perm(PERMISSIONS.PURCHASE_WRITE)
  create(@Body() dto: CreatePurchaseDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  @Put(':id')
  @Perm(PERMISSIONS.PURCHASE_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/approve')
  @Perm(PERMISSIONS.PURCHASE_APPROVE)
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Post(':id/cancel')
  @Perm(PERMISSIONS.PURCHASE_WRITE)
  cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }

  @Post(':id/receive')
  @Perm(PERMISSIONS.PURCHASE_RECEIVE)
  receive(@Param('id') id: string, @Body() dto: FulfillDto, @CurrentUser() user: AuthUser) {
    return this.service.receive(id, dto, user.id);
  }
}
