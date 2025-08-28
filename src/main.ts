import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// ⬇️ change these two lines
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.use(cookieParser()); // now works
  app.enableCors({ origin: [/localhost:\d+$/], credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`🚀 Quiz API running at http://localhost:${port}/api`);
}
bootstrap();
