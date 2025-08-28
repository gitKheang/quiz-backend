import { Body, Controller, Delete, Get, Header, Param, Post, Put } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';

@Controller()
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  @Get('categories/:categoryIdOrSlug/questions')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  listByCategory(@Param('categoryIdOrSlug') categoryIdOrSlug: string) {
    return this.service.listByCategory(categoryIdOrSlug);
  }

  @Get('questions/:id')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Post('categories/:categoryIdOrSlug/questions')
  create(
    @Param('categoryIdOrSlug') categoryIdOrSlug: string,
    @Body() body: CreateQuestionDto | any,
  ) {
    return this.service.create(categoryIdOrSlug, body);
  }

  @Put('questions/:id')
  update(@Param('id') id: string, @Body() body: UpdateQuestionDto | any) {
    return this.service.update(id, body);
  }

  @Delete('questions/:id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
