import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.template.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: { items: { include: { material: { include: { category: true } } } } },
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.template.findUnique({
      where: { id },
      include: { items: { include: { material: { include: { category: true } } } } },
    });
    if (!t) throw new NotFoundException('Template não encontrado');
    return t;
  }

  async create(data: { name: string; items: { materialId: string; meters: number }[] }) {
    const { items, ...templateData } = data;
    return this.prisma.template.create({
      data: {
        ...templateData,
        items: { create: items },
      },
      include: { items: { include: { material: true } } },
    });
  }

  async update(id: string, data: any) {
    const { items, ...templateData } = data;
    if (items) {
      await this.prisma.templateItem.deleteMany({ where: { templateId: id } });
    }
    return this.prisma.template.update({
      where: { id },
      data: {
        ...templateData,
        ...(items ? { items: { create: items } } : {}),
      },
      include: { items: { include: { material: true } } },
    });
  }

  async remove(id: string) {
    return this.prisma.template.update({ where: { id }, data: { active: false } });
  }
}
