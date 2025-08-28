import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Range = 'daily' | 'weekly' | 'monthly' | 'all';
function startOfRange(range: Range): Date | null {
  const now = new Date();
  if (range === 'all') return null;
  if (range === 'daily') { const d = new Date(now); d.setHours(0,0,0,0); return d; }
  if (range === 'weekly') { const d = new Date(now); const day = d.getDay(); const diff = (day + 6) % 7; d.setDate(d.getDate() - diff); d.setHours(0,0,0,0); return d; }
  if (range === 'monthly') { return new Date(now.getFullYear(), now.getMonth(), 1); }
  return null;
}
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private prisma: PrismaService) {}
  @Get()
  async getLeaderboard(
    @Query('categoryId') categoryId?: string,
    @Query('range') range: Range = 'all',
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    const limit = Math.min(Math.max(parseInt(limitStr || '20'), 1), 100);
    const offset = Math.max(parseInt(offsetStr || '0'), 0);
    const from = startOfRange(range);
    const where: any = { isCompleted: true };
    if (categoryId) where.categoryId = categoryId;
    if (from) where.updatedAt = { gte: from };
    const sessions = await this.prisma.quizSession.findMany({
      where,
      orderBy: [{ score: 'desc' }, { timeTakenSec: 'asc' }, { updatedAt: 'desc' }],
      skip: offset,
      take: limit,
    });
    const entries = sessions.map((s, idx) => ({
      id: s.attemptId,
      userName: `Player-${s.attemptId.slice(0,4).toUpperCase()}`,
      score: s.score ?? 0,
      timeSec: s.timeTakenSec ?? 0,
      submittedAt: (s.endAt ?? s.updatedAt).toISOString(),
      rank: offset + idx + 1,
      categoryId: s.categoryId,
    }));
    return entries;
  }
}
