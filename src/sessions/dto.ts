import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  categoryId!: string;
  @IsOptional() @IsString()
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  @IsInt() @Min(1)
  numQuestions!: number;
  @IsOptional() @IsInt() @Min(1)
  timeLimitMin?: number;
  @IsOptional() @IsInt() @Min(1)
  timeLimitMinutes?: number;
}
export class SaveProgressDto {
  @IsArray()
  answers!: { questionId: string; chosenOptionIds: string[] }[];
}
