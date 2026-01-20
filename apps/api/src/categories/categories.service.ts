import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  create(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: dto });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    if (dto.parentId === id) throw new BadRequestException('分類不可以是自己的上層');
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const used = await this.prisma.product.count({ where: { categoryId: id } });
    const kids = await this.prisma.category.count({ where: { parentId: id } });
    if (used || kids) throw new BadRequestException('分類下仍有商品或子分類');
    await this.prisma.category.delete({ where: { id } });
    return { ok: true };
  }
}
