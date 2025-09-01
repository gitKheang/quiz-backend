import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SignUpDto {
  @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
  @MinLength(8) password!: string;
}

export class SignInDto {
  @IsEmail() email!: string;
  @MinLength(8) password!: string;
}
