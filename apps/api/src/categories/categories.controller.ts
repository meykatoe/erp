import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PERMISSIONS } from '../common/constants/permissions';
import { Perm } from '../common/decorators/permissions.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @Perm(PERMISSIONS.PRODUCT_READ)
  list() {
    return this.service.list();
  }

  @Post()
  @Perm(PERMISSIONS.PRODUCT_WRITE)
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Perm(PERMISSIONS.PRODUCT_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Perm(PERMISSIONS.PRODUCT_WRITE)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
