import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OptionInput {
  // allow existing option ids so backend can map correctness by id
  @IsOptional()
  id?: string | number;

  @IsString()
  text!: string;

  // allow client to mark an option as correct (optional)
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

  // ✅ fields that were being stripped by the ValidationPipe whitelist
  @IsOptional() @IsArray()
  correctOptionIds?: (string | number)[];

  @IsOptional() @IsArray() @Type(() => Number)
  correctIndexes?: number[];

  @IsOptional() @IsArray()
  correctOptionTexts?: string[];
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

  // allow sending correctness on update as well
  @IsOptional() @IsArray()
  correctOptionIds?: (string | number)[];

  @IsOptional() @IsArray() @Type(() => Number)
  correctIndexes?: number[];

  @IsOptional() @IsArray()
  correctOptionTexts?: string[];
}
