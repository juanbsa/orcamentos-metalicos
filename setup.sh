#!/bin/bash
set -e

echo "=== Setup: Sistema de Orçamentos Metálicos ==="

# Backend
echo ""
echo "→ Instalando dependências do backend..."
cd backend
npm install

echo "→ Gerando cliente Prisma..."
npx prisma generate

echo ""
echo "→ Instalando dependências do frontend..."
cd ../frontend
npm install

echo ""
echo "=== Setup concluído! ==="
echo ""
echo "Para iniciar o sistema:"
echo ""
echo "  1. Com Docker (recomendado):"
echo "     cd /Users/juanbarbosa/orcamentos-metalicos"
echo "     docker-compose up -d"
echo ""
echo "  2. Localmente (necessário PostgreSQL rodando):"
echo "     Terminal 1 (backend):"
echo "       cd backend"
echo "       export DATABASE_URL='postgresql://usuario:senha@localhost:5432/orcamentos'"
echo "       npx prisma migrate dev --name init"
echo "       npx ts-node prisma/seed.ts"
echo "       npm run start:dev"
echo ""
echo "     Terminal 2 (frontend):"
echo "       cd frontend"
echo "       npm run dev"
echo ""
echo "  Acesso: http://localhost:3000"
echo "  Admin:  admin@empresa.com / admin123"
echo "  API:    http://localhost:3001/api/docs"
