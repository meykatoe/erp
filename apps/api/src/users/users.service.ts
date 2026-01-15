import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PageQueryDto } from '../common/dto/page-query.dto';
import { pageArgs, toPage } from '../common/utils/paginate';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

const select = {
  id: true,
  email: true,
  name: true,
  active: true,
  createdAt: true,
  roles: { select: { role: { select: { id: true, name: true } } } },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: PageQueryDto) {
    const where: Prisma.UserWhereInput = q.keyword
      ? {
          OR: [
            { name: { contains: q.keyword, mode: 'insensitive' } },
            { email: { contains: q.keyword, mode: 'insensitive' } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({ where, select, ...pageArgs(q), orderBy: { createdAt: 'desc' } }),
      this.prisma.user.count({ where }),
    ]);
    return toPage(items, total, q);
  }

  get(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select });
  }

  async create(dto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 10),
        roles: { create: (dto.roleIds ?? []).map((roleId) => ({ roleId })) },
      },
      select,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
      return tx.user.update({
        where: { id },
        data: { name: dto.name, active: dto.active },
        select,
      });
    });
  }

  async resetPassword(id: string, password: string) {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    return { ok: true };
  }
}
