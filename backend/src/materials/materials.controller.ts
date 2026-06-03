import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MaterialsService } from './materials.service';

@ApiTags('Materials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('materials')
export class MaterialsController {
  constructor(private service: MaterialsService) {}

  @Get('categories') findCategories() { return this.service.findCategories(); }
  @Post('categories') createCategory(@Body('name') name: string) { return this.service.createCategory(name); }

  @Get() findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) { return this.service.findAll(search, categoryId, +page || 1, +limit || 20); }

  @Post() create(@Body() dto: any) { return this.service.create(dto); }
  @Post(':id/duplicate') duplicate(@Param('id') id: string) { return this.service.duplicate(id); }
  @Put(':id') update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
