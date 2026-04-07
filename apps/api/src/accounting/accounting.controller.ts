import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Perm } from '../common/decorators/permissions.decorator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { AccountingService } from './accounting.service';
import { CreateAccountDto, CreateJournalDto, InvoiceQueryDto, PayDto } from './dto/accounting.dto';

@Controller('accounting')
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  @Get('accounts')
  @Perm(PERMISSIONS.ACCOUNTING_READ)
  accounts() {
    return this.service.listAccounts();
  }

  @Post('accounts')
  @Perm(PERMISSIONS.ACCOUNTING_WRITE)
  createAccount(@Body() dto: CreateAccountDto) {
    return this.service.createAccount(dto);
  }

  @Patch('accounts/:id')
  @Perm(PERMISSIONS.ACCOUNTING_WRITE)
  updateAccount(@Param('id') id: string, @Body() dto: { name?: string; active?: boolean }) {
    return this.service.updateAccount(id, dto);
  }
}
