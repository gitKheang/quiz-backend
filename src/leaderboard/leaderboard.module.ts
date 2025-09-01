import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LeaderboardController],
})
export class LeaderboardModule {}
