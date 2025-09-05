// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security & parsing
  app.use(helmet());
  app.use(cookieParser());

  // API prefix & validation
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Allow comma-separated origins in FRONTEND_URL
  // e.g. "https://your-vercel.vercel.app,https://www.yourdomain.com"
  const envOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Always allow local dev
  const corsOrigins = Array.from(new Set([...envOrigins, 'http://localhost:5173']));

  app.enableCors({
    origin: corsOrigins,           // array of allowed origins
    credentials: true,             // allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);

  console.log(`=> Quiz API running at http://localhost:${port}/api`);
  console.log(`=> CORS origins: ${corsOrigins.join(', ') || '(none)'}`);
}
bootstrap();
