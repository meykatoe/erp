import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { Perm } from '../common/decorators/permissions.decorator';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @Perm(PERMISSIONS.ROLE_READ)
  list() {
    return this.service.list();
  }

  @Get('permissions')
  @Perm(PERMISSIONS.ROLE_READ)
  permissions() {
    return this.service.permissions();
  }

  @Post()
  @Perm(PERMISSIONS.ROLE_WRITE)
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Perm(PERMISSIONS.ROLE_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }
}
