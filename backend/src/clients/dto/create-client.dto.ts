import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ClientType } from '../entities/client.entity';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsEnum(ClientType)
  type: ClientType;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  commercialRegistration?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
