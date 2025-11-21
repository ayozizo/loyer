import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CaseStage, CaseStatus, CaseType } from '../entities/case.entity';

export class UpdateCaseDto {
  @IsOptional()
  @IsString()
  caseNumber?: string;

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

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsUUID()
  responsibleLawyerId?: string;
}
