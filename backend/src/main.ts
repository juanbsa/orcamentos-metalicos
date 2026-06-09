import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let initialized = false;

async function bootstrap() {
  if (initialized) return;
  initialized = true;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.enableCors({ origin: process.env.FRONTEND_URL || '*' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle('Orçamentos Metálicos API')
    .setDescription('API para sistema de orçamentos de estruturas metálicas')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
}

// Handler exportado para o Vercel (serverless)
export default async (req: express.Request, res: express.Response) => {
  await bootstrap();
  server(req, res);
};

// Desenvolvimento local
if (!process.env.VERCEL) {
  bootstrap().then(() => {
    server.listen(process.env.PORT || 3001, () => {
      console.log(`Backend rodando em http://localhost:${process.env.PORT || 3001}`);
    });
  });
}
