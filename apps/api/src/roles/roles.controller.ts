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
}
