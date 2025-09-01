import { Module } from "@nestjs/common";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";
import { AdminGuard } from "../auth/admin.guard";

@Module({
  controllers: [QuestionsController],
  providers: [QuestionsService, AdminGuard],
  exports: [QuestionsService],
})
export class QuestionsModule {}
