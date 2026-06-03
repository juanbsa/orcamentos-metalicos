import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  private calcTotals(items: any[], expenses: any[], wastePercent: number, pricePerKg: number, profitType: string, profitValue: number) {
    let totalMaterials = 0;
    const calcItems = items.map(item => {
      const totalWeight = item.meters * item.linearWeight;
      const weightWithWaste = totalWeight * (1 + wastePercent / 100);
      const totalValue = weightWithWaste * pricePerKg;
      totalMaterials += totalValue;
      return { ...item, totalWeight, weightWithWaste, unitValue: pricePerKg, totalValue };
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.value, 0);
    const subtotal = totalMaterials + totalExpenses;
    let profitAmount = 0;
    let total = 0;

    if (profitType === 'MULTIPLIER') {
      total = subtotal * profitValue;
      profitAmount = total - subtotal;
    } else {
      profitAmount = subtotal * (profitValue / 100);
      total = subtotal + profitAmount;
    }

    return { calcItems, totalMaterials, totalExpenses, subtotal, profitAmount, total };
  }

  async findAll(search?: string, status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { number: isNaN(+search) ? undefined : +search },
      ].filter(Boolean);
    }
    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, fantasyName: true, type: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.quote.count({ where }),
    ]);
    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { material: { include: { category: true } } } },
        expenses: { include: { expense: true } },
      },
    });
    if (!quote) throw new NotFoundException('Orçamento não encontrado');
    return quote;
  }

  async create(data: any, userId: string) {
    const { items = [], expenses = [], ...quoteData } = data;
    const { calcItems, totalMaterials, totalExpenses, subtotal, profitAmount, total } =
      this.calcTotals(items, expenses, quoteData.wastePercent || 5, quoteData.pricePerKg || 35, quoteData.profitType || 'MULTIPLIER', quoteData.profitValue || 3);

    return this.prisma.quote.create({
      data: {
        ...quoteData,
        userId,
        totalMaterials,
        totalExpenses,
        subtotal,
        profitAmount,
        total,
        items: {
          create: calcItems.map(({ materialId, meters, linearWeight, totalWeight, weightWithWaste, unitValue, totalValue }) => ({
            materialId, meters, totalWeight, weightWithWaste, unitValue, totalValue,
          })),
        },
        expenses: {
          create: expenses.map(({ expenseId, value }) => ({ expenseId, value })),
        },
      },
      include: {
        customer: true,
        items: { include: { material: true } },
        expenses: { include: { expense: true } },
      },
    });
  }

  async update(id: string, data: any) {
    const { items, expenses, ...quoteData } = data;

    if (items !== undefined || expenses !== undefined) {
      const quote = await this.prisma.quote.findUnique({ where: { id } });
      const currentItems = items || [];
      const currentExpenses = expenses || [];
      const { calcItems, totalMaterials, totalExpenses, subtotal, profitAmount, total } =
        this.calcTotals(currentItems, currentExpenses, quoteData.wastePercent || quote.wastePercent, quoteData.pricePerKg || quote.pricePerKg, quoteData.profitType || quote.profitType, quoteData.profitValue || quote.profitValue);

      await this.prisma.quoteItem.deleteMany({ where: { quoteId: id } });
      await this.prisma.quoteExpense.deleteMany({ where: { quoteId: id } });

      return this.prisma.quote.update({
        where: { id },
        data: {
          ...quoteData,
          totalMaterials,
          totalExpenses,
          subtotal,
          profitAmount,
          total,
          items: {
            create: calcItems.map(({ materialId, meters, totalWeight, weightWithWaste, unitValue, totalValue }) => ({
              materialId, meters, totalWeight, weightWithWaste, unitValue, totalValue,
            })),
          },
          expenses: {
            create: currentExpenses.map(({ expenseId, value }) => ({ expenseId, value })),
          },
        },
        include: {
          customer: true,
          items: { include: { material: true } },
          expenses: { include: { expense: true } },
        },
      });
    }

    return this.prisma.quote.update({ where: { id }, data: quoteData });
  }

  async updateStatus(id: string, status: string) {
    return this.prisma.quote.update({ where: { id }, data: { status: status as any } });
  }

  async duplicate(id: string, userId: string) {
    const original = await this.findOne(id);
    const { id: _id, number, createdAt, updatedAt, user, ...quoteData } = original;
    return this.create({
      ...quoteData,
      customerId: original.customerId,
      status: 'ELABORACAO',
      items: original.items.map(i => ({ materialId: i.materialId, meters: i.meters, linearWeight: i.material.linearWeight })),
      expenses: original.expenses.map(e => ({ expenseId: e.expenseId, value: e.value })),
    }, userId);
  }
}
