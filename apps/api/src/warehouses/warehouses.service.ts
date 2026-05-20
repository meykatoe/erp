import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto } from './dto/warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.warehouse.findMany({ orderBy: { code: 'asc' } });
  }

  create(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data: dto });
  }

  update(id: string, dto: UpdateWarehouseDto) {
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }
}
