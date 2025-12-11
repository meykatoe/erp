import { Controller, Get, Query } from '@nestjs/common';
import { Perm } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../common/constants/permissions';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Perm(PERMISSIONS.AUDIT_READ)
  list(@Query() q: PageQueryDto) {
    return this.service.list(q);
  }
}
