import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateCaseSessionDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
