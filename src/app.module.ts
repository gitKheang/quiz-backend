import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { QuestionsModule } from './questions/questions.module';
import { SessionsModule } from './sessions/sessions.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';

@Module({
  imports: [PrismaModule, CategoriesModule, QuestionsModule, SessionsModule, LeaderboardModule],
})
export class AppModule {}
