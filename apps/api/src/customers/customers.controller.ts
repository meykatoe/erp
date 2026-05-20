import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { Perm } from '../common/decorators/permissions.decorator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Get()
  @Perm(PERMISSIONS.CUSTOMER_READ)
  list(@Query() q: PageQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Perm(PERMISSIONS.CUSTOMER_READ)
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Perm(PERMISSIONS.CUSTOMER_WRITE)
  create(@Body() dto: CreateCustomerDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Perm(PERMISSIONS.CUSTOMER_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.service.update(id, dto);
  }
}
