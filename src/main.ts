// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Default to Vite port in dev
  const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  app.enableCors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  console.log(`=> Quiz API running at http://localhost:${port}/api`);
  console.log(`=> CORS origin: ${FRONTEND_URL}`);
}
bootstrap();
