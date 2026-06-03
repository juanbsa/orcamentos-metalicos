import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; email: string; password: string; role: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictException('Email já cadastrado');
    const password = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { ...data, password, role: data.role as any },
      select: { id: true, name: true, email: true, role: true, active: true },
    });
  }

  async update(id: string, data: any) {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, active: true },
    });
  }

  async remove(id: string) {
    return this.prisma.user.update({ where: { id }, data: { active: false } });
  }
}
