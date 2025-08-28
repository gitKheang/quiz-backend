import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());

  // Allow localhost, your prod domain, and (optional) Vercel previews
  const allowlist: (string | RegExp)[] = [
    /^https?:\/\/localhost(?::\d+)?$/,          // local dev
    'https://quiz-app-frontend-dun.vercel.app', // production frontend
    /^https:\/\/quiz-app-frontend-dun-.*\.vercel\.app$/, // previews (optional)
  ];

  app.enableCors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // Postman/cURL
      const ok = allowlist.some(rule =>
        rule instanceof RegExp ? rule.test(origin) : rule === origin,
      );
      cb(ok ? null : new Error(`CORS blocked: ${origin}`), ok);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // keep true only if you actually need cookies/auth headers
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`🚀 Quiz API running at http://localhost:${port}/api`);
}
bootstrap();
