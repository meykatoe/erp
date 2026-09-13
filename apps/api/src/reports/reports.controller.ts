import { Controller, Get, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { Perm } from '../common/decorators/permissions.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@Perm(PERMISSIONS.REPORT_READ)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('sales-by-month')
  salesByMonth(@Query('months') months?: string) {
    return this.service.salesByMonth(months ? Math.min(36, Math.max(1, Number(months))) : 12);
  }

  @Get('top-products')
  top(@Query('limit') limit?: string) {
    return this.service.topProducts(limit ? Math.min(50, Number(limit)) : 10);
  }

  @Get('inventory-valuation')
  valuation() {
    return this.service.inventoryValuation();
  }
}
