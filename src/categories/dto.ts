import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString() @IsNotEmpty()
  name!: string;
  @IsString() @IsNotEmpty()
  slug!: string;
  @IsOptional() @IsString()
  description?: string;
  @IsOptional() @IsString()
  color?: string;
  @IsOptional() @IsString()
  icon?: string;
  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
  @IsOptional() @IsBoolean()
  isDefault?: boolean;
  @IsOptional() @IsInt() @Min(0)
  timeLimitSec?: number;
}
export class UpdateCategoryDto {
  @IsOptional() @IsString()
  name?: string;
  @IsOptional() @IsString()
  slug?: string;
  @IsOptional() @IsString()
  description?: string;
  @IsOptional() @IsString()
  color?: string;
  @IsOptional() @IsString()
  icon?: string;
  @IsOptional() @IsInt() @Min(0)
  sortOrder?: number;
  @IsOptional() @IsBoolean()
  isDefault?: boolean;
  @IsOptional() @IsInt() @Min(0)
  timeLimitSec?: number;
}
