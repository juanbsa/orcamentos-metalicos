import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where: any = { active: true };
    if (search) where.name = { contains: search, mode: 'insensitive' };
    return this.prisma.expense.findMany({ where, orderBy: { name: 'asc' } });
  }

  async create(data: { name: string; defaultValue: number }) {
    return this.prisma.expense.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.expense.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.expense.update({ where: { id }, data: { active: false } });
  }
}
