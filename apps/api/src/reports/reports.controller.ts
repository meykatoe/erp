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
}
