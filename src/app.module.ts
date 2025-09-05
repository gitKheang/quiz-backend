import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { CategoriesModule } from './categories/categories.module';
import { QuestionsModule } from './questions/questions.module';
import { SessionsModule } from './sessions/sessions.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthController } from './health.controller'; // <— add

@Module({
  imports: [
    PrismaModule,
    CategoriesModule,
    QuestionsModule,
    SessionsModule,
    LeaderboardModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [HealthController], // <— add
})
export class AppModule {}
