import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalQuotes,
      monthQuotes,
      approvedQuotes,
      totalQuotesMonth,
      topCustomers,
      topMaterials,
      statusCounts,
    ] = await Promise.all([
      this.prisma.quote.count(),
      this.prisma.quote.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.quote.aggregate({ where: { status: 'APROVADO' }, _sum: { total: true } }),
      this.prisma.quote.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { total: true }, _count: true }),
      this.prisma.quote.groupBy({
        by: ['customerId'],
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      this.prisma.quoteItem.groupBy({
        by: ['materialId'],
        _sum: { meters: true },
        _count: true,
        orderBy: { _count: { materialId: 'desc' } },
        take: 5,
      }),
      this.prisma.quote.groupBy({ by: ['status'], _count: true }),
    ]);

    const totalApproved = approvedQuotes._sum.total || 0;
    const approvedCount = await this.prisma.quote.count({ where: { status: 'APROVADO' } });
    const conversionRate = totalQuotes > 0 ? (approvedCount / totalQuotes) * 100 : 0;

    const customerIds = topCustomers.map(c => c.customerId);
    const customers = await this.prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, fantasyName: true },
    });

    const materialIds = topMaterials.map(m => m.materialId);
    const materials = await this.prisma.material.findMany({
      where: { id: { in: materialIds } },
      select: { id: true, name: true, code: true },
    });

    return {
      totalQuotes,
      monthQuotes,
      totalValueMonth: totalQuotesMonth._sum.total || 0,
      totalApproved,
      conversionRate: Math.round(conversionRate * 10) / 10,
      statusCounts: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
      topCustomers: topCustomers.map(c => ({
        ...customers.find(cu => cu.id === c.customerId),
        total: c._sum.total,
        count: c._count,
      })),
      topMaterials: topMaterials.map(m => ({
        ...materials.find(ma => ma.id === m.materialId),
        totalMeters: m._sum.meters,
        count: m._count,
      })),
    };
  }
}
