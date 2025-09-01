import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto";
import { AdminGuard } from "../auth/admin.guard";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  // ---- Public (read) ----
  @Get()
  list() {
    return this.service.list();
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.service.get(id);
  }

  // ---- Admin only (write) ----
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() body: CreateCategoryDto) {
    return this.service.create(body);
  }

  @UseGuards(AdminGuard)
  @Put(":id")
  update(@Param("id") id: string, @Body() body: UpdateCategoryDto) {
    return this.service.update(id, body);
  }

  @UseGuards(AdminGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
