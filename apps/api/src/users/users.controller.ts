import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { Perm } from '../common/decorators/permissions.decorator';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  @Perm(PERMISSIONS.USER_READ)
  list(@Query() q: PageQueryDto) {
    return this.service.list(q);
  }

  @Get(':id')
  @Perm(PERMISSIONS.USER_READ)
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Perm(PERMISSIONS.USER_WRITE)
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Perm(PERMISSIONS.USER_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }
}
