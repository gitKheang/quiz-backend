import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, SaveProgressDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';
import { verifyToken } from '../auth/jwt.util';

@Controller('quiz-sessions')
export class SessionsController {
  constructor(
    private readonly service: SessionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  async create(@Body() body: CreateSessionDto, @Req() req: Request) {
    const resp = await this.service.create(body);

    const token: string | undefined =
      (req.cookies && (req.cookies as any)['access_token']) ??
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    const payload = token ? verifyToken(token) : null;
    const userId = (payload as any)?.sub;

    if (userId && resp?.attemptId) {
      await this.prisma.quizSession
        .update({ where: { attemptId: resp.attemptId }, data: { userId } })
        .catch(() => {});
    }

    return resp;
  }

  @Patch(':id/progress')
  save(@Param('id') id: string, @Body() body: SaveProgressDto) {
    return this.service.saveProgress(id, body);
  }

  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() body?: SaveProgressDto) {
    return this.service.submit(id, body);
  }
}
