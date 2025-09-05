// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

function parseOrigins(csv?: string): (string | RegExp)[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => (s === '*' ? /.*/ : s));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security & parsing
  app.use(helmet());
  app.use(cookieParser());

  // Behind proxies (Vercel, Render, Nginx, etc.) so req.secure / x-forwarded-proto works
  const http = app.getHttpAdapter().getInstance?.();
  try {
    http?.set?.('trust proxy', 1);
  } catch {
    // ignore if adapter doesn't support
  }

  // API prefix & validation
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Allow comma-separated origins in FRONTEND_URL (or CORS_ORIGINS as a fallback)
  // e.g. FRONTEND_URL="https://your-frontend.vercel.app,https://www.yourdomain.com"
  const envOrigins = parseOrigins(process.env.FRONTEND_URL || process.env.CORS_ORIGINS);

  // Always allow local dev
  const allowList: (string | RegExp)[] = [
    ...envOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // same-origin / server-to-server
      const ok = allowList.some(o => (o instanceof RegExp ? o.test(origin) : o === origin));
      return ok ? cb(null, true) : cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true, // allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
    maxAge: 86400,
  });

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');

  console.log(`=> Quiz API running at http://localhost:${port}/api`);
  console.log(
    `=> CORS origins: ${envOrigins.length ? envOrigins.join(', ') : '(set FRONTEND_URL or CORS_ORIGINS)'} + localhost`
  );
}
bootstrap();
