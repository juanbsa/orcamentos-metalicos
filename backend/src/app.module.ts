import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { MaterialsModule } from './materials/materials.module';
import { ExpensesModule } from './expenses/expenses.module';
import { QuotesModule } from './quotes/quotes.module';
import { TemplatesModule } from './templates/templates.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PdfModule } from './pdf/pdf.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    CustomersModule,
    MaterialsModule,
    ExpensesModule,
    QuotesModule,
    TemplatesModule,
    DashboardModule,
    PdfModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule {}
