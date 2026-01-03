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

  async remove(id: string) {
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (role.name === 'admin') throw new BadRequestException('不可刪除管理員角色');
    if (role._count.users > 0) throw new BadRequestException('仍有使用者使用此角色');
    await this.prisma.role.delete({ where: { id } });
    return { ok: true };
  }
}
