import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@empresa.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@empresa.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const comercialPassword = await bcrypt.hash('comercial123', 10);
  await prisma.user.upsert({
    where: { email: 'comercial@empresa.com' },
    update: {},
    create: {
      name: 'Vendedor',
      email: 'comercial@empresa.com',
      password: comercialPassword,
      role: 'COMERCIAL',
    },
  });

  const categories = [
    { name: 'Tubos Retangulares' },
    { name: 'Tubos Quadrados' },
    { name: 'Tubos Redondos' },
    { name: 'Cantoneiras' },
    { name: 'Barras Chatas' },
    { name: 'Perfis U' },
    { name: 'Perfis I' },
    { name: 'Barras Redondas' },
  ];

  for (const cat of categories) {
    await prisma.materialCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const tuboRetangular = await prisma.materialCategory.findUnique({ where: { name: 'Tubos Retangulares' } });
  const tuboQuadrado = await prisma.materialCategory.findUnique({ where: { name: 'Tubos Quadrados' } });
  const cantoneira = await prisma.materialCategory.findUnique({ where: { name: 'Cantoneiras' } });
  const barraChata = await prisma.materialCategory.findUnique({ where: { name: 'Barras Chatas' } });

  const materials = [
    { code: 'TR-5030-15', name: 'Tubo Retangular 50x30x1,5', categoryId: tuboRetangular.id, side1: 50, side2: 30, thickness: 1.5, specificWeight: 7850, linearWeight: 1.84 },
    { code: 'TR-5030-20', name: 'Tubo Retangular 50x30x2,0', categoryId: tuboRetangular.id, side1: 50, side2: 30, thickness: 2.0, specificWeight: 7850, linearWeight: 2.41 },
    { code: 'TR-8040-20', name: 'Tubo Retangular 80x40x2,0', categoryId: tuboRetangular.id, side1: 80, side2: 40, thickness: 2.0, specificWeight: 7850, linearWeight: 3.55 },
    { code: 'TQ-3030-15', name: 'Tubo Quadrado 30x30x1,5', categoryId: tuboQuadrado.id, side1: 30, side2: 30, thickness: 1.5, specificWeight: 7850, linearWeight: 1.36 },
    { code: 'TQ-4040-20', name: 'Tubo Quadrado 40x40x2,0', categoryId: tuboQuadrado.id, side1: 40, side2: 40, thickness: 2.0, specificWeight: 7850, linearWeight: 2.42 },
    { code: 'TQ-5050-20', name: 'Tubo Quadrado 50x50x2,0', categoryId: tuboQuadrado.id, side1: 50, side2: 50, thickness: 2.0, specificWeight: 7850, linearWeight: 3.08 },
    { code: 'CA-1P', name: 'Cantoneira 1"', categoryId: cantoneira.id, side1: 25.4, side2: 25.4, thickness: 3.2, specificWeight: 7850, linearWeight: 1.22 },
    { code: 'CA-2P', name: 'Cantoneira 2"', categoryId: cantoneira.id, side1: 50.8, side2: 50.8, thickness: 4.8, specificWeight: 7850, linearWeight: 3.71 },
    { code: 'BC-2020', name: 'Barra Chata 20x3', categoryId: barraChata.id, side1: 20, side2: 3, thickness: 3, specificWeight: 7850, linearWeight: 0.47 },
    { code: 'BC-5010', name: 'Barra Chata 50x10', categoryId: barraChata.id, side1: 50, side2: 10, thickness: 10, specificWeight: 7850, linearWeight: 3.93 },
  ];

  for (const mat of materials) {
    await prisma.material.upsert({
      where: { code: mat.code },
      update: {},
      create: mat,
    });
  }

  const expenses = [
    { name: 'Munck', defaultValue: 350 },
    { name: 'Empilhadeira', defaultValue: 200 },
    { name: 'Transporte', defaultValue: 150 },
    { name: 'Instalação', defaultValue: 500 },
    { name: 'Dobradiça', defaultValue: 25 },
    { name: 'Parabolt', defaultValue: 5 },
    { name: 'PTA', defaultValue: 80 },
    { name: 'Eletrodo', defaultValue: 30 },
    { name: 'Disco de Corte', defaultValue: 15 },
  ];

  for (const exp of expenses) {
    const exists = await prisma.expense.findFirst({ where: { name: exp.name } });
    if (!exists) {
      await prisma.expense.create({ data: exp });
    }
  }

  console.log('Seed concluído com sucesso!');
  console.log('Admin: admin@empresa.com / admin123');
  console.log('Comercial: comercial@empresa.com / comercial123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
