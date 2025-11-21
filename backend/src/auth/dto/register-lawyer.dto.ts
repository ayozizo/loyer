import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class RegisterLawyerDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  phone?: string;

  @MinLength(6)
  password: string;
}
