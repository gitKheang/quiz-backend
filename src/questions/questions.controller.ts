import { Body, Controller, Delete, Get, Header, Param, Post, Put, UseGuards } from "@nestjs/common";
import { QuestionsService } from "./questions.service";
import { CreateQuestionDto, UpdateQuestionDto } from "./dto";
import { AdminGuard } from "../auth/admin.guard";

@Controller()
export class QuestionsController {
  constructor(private readonly service: QuestionsService) {}

  // Public (read)
  @Get("categories/:categoryIdOrSlug/questions")
  @Header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  listByCategory(@Param("categoryIdOrSlug") categoryIdOrSlug: string) {
    return this.service.listByCategory(categoryIdOrSlug);
  }

  @Get("questions/:id")
  @Header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  // Admin only (write) 
  @UseGuards(AdminGuard)
  @Post("categories/:categoryIdOrSlug/questions")
  create(@Param("categoryIdOrSlug") categoryIdOrSlug: string, @Body() body: CreateQuestionDto) {
    return this.service.create(categoryIdOrSlug, body);
  }

  @UseGuards(AdminGuard)
  @Put("questions/:id")
  update(@Param("id") id: string, @Body() body: UpdateQuestionDto) {
    return this.service.update(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete("questions/:id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
