import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CaseStage, CaseStatus, CaseType } from '../entities/case.entity';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  caseNumber: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(CaseType)
  type?: CaseType;

  @IsOptional()
  @IsString()
  court?: string;

  @IsOptional()
  @IsEnum(CaseStage)
  stage?: CaseStage;

  @IsOptional()
  @IsEnum(CaseStatus)
  status?: CaseStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  responsibleLawyerId?: string;
}
