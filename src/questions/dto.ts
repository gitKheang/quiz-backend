import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OptionInput {
  @IsString()
  text!: string;
  @IsOptional()
  isCorrect?: boolean;
}
export class CreateQuestionDto {
  @IsString()
  text!: string;
  @IsOptional() @IsString()
  explanation?: string;
  @IsString() @IsIn(['easy','medium','hard'])
  difficulty!: 'easy' | 'medium' | 'hard';
  @IsOptional() @IsString()
  type?: 'single' | 'multi';
  @IsOptional() @IsString()
  imageUrl?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OptionInput)
  options!: OptionInput[];
}
export class UpdateQuestionDto {
  @IsOptional() @IsString()
  text?: string;
  @IsOptional() @IsString()
  explanation?: string;
  @IsOptional() @IsString() @IsIn(['easy','medium','hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
  @IsOptional() @IsString()
  type?: 'single' | 'multi';
  @IsOptional() @IsString()
  imageUrl?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OptionInput)
  options?: OptionInput[];
}
