import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, categoryId?: string, page = 1, limit = 20) {
    const where: any = { active: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
        include: { category: { select: { id: true, name: true } } },
      }),
      this.prisma.material.count({ where }),
    ]);
    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async findCategories() {
    return this.prisma.materialCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async create(data: any) {
    return this.prisma.material.create({ data, include: { category: true } });
  }

  async update(id: string, data: any) {
    return this.prisma.material.update({ where: { id }, data, include: { category: true } });
  }

  async remove(id: string) {
    return this.prisma.material.update({ where: { id }, data: { active: false } });
  }

  async duplicate(id: string) {
    const original = await this.prisma.material.findUnique({ where: { id } });
    if (!original) throw new NotFoundException('Material não encontrado');
    const { id: _id, createdAt, updatedAt, ...data } = original;
    const newCode = `${data.code}-COPY-${Date.now()}`;
    return this.prisma.material.create({
      data: { ...data, code: newCode, name: `${data.name} (Cópia)` },
      include: { category: true },
    });
  }

  async createCategory(name: string) {
    return this.prisma.materialCategory.create({ data: { name } });
  }
}
