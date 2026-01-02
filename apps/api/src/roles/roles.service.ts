import { BadRequestException, Injectable } from '@nestjs/common';
import { ALL_PERMISSIONS } from '../common/constants/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

export function assertValidPermissions(perms: string[]) {
  const bad = perms.filter((p) => !ALL_PERMISSIONS.includes(p));
  if (bad.length) throw new BadRequestException(`未知的權限: ${bad.join(', ')}`);
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    });
  }

  permissions() {
    return ALL_PERMISSIONS;
  }

  create(dto: CreateRoleDto) {
    assertValidPermissions(dto.permissions);
    return this.prisma.role.create({ data: dto });
  }

  update(id: string, dto: UpdateRoleDto) {
    if (dto.permissions) assertValidPermissions(dto.permissions);
    return this.prisma.role.update({ where: { id }, data: dto });
  }
}
