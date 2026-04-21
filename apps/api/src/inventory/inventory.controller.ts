import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Perm } from '../common/decorators/permissions.decorator';
import { AdjustDto, StockQueryDto, TransferDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get('levels')
  @Perm(PERMISSIONS.INVENTORY_READ)
  levels(@Query() q: StockQueryDto) {
    return this.service.levels(q);
  }

  @Get('movements')
  @Perm(PERMISSIONS.INVENTORY_READ)
  movements(@Query() q: StockQueryDto) {
    return this.service.movements(q);
  }

  @Post('adjust')
  @Perm(PERMISSIONS.INVENTORY_ADJUST)
  adjust(@Body() dto: AdjustDto, @CurrentUser() user: AuthUser) {
    return this.service.adjust(dto, user.id);
  }

  @Post('transfer')
  @Perm(PERMISSIONS.INVENTORY_ADJUST)
  transfer(@Body() dto: TransferDto, @CurrentUser() user: AuthUser) {
    return this.service.transfer(dto, user.id);
  }
}
