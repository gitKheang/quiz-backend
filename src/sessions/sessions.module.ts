import { Module } from '@nestjs/common';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestionsModule } from '../questions/questions.module';

@Module({
  imports: [PrismaModule, QuestionsModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
