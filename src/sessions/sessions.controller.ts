import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, SaveProgressDto } from './dto';

@Controller('quiz-sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() body: CreateSessionDto) {
    return this.service.create(body);
  }

  @Patch(':id/progress')
  save(@Param('id') id: string, @Body() body: SaveProgressDto) {
    return this.service.saveProgress(id, body);
  }

  // Accept optional answers in body; if omitted we grade saved progress
  @Post(':id/submit')
  submit(@Param('id') id: string, @Body() body?: SaveProgressDto) {
    return this.service.submit(id, body);
  }
}
