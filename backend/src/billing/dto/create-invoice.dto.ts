import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { BillingModel, Currency, InvoiceStatus } from '../entities/invoice.entity';

export class CreateInvoiceDto {
  @IsUUID()
  clientId: string;

  @IsOptional()
  @IsUUID()
  caseId?: string;

  @IsEnum(BillingModel)
  billingModel: BillingModel;

  @IsNumber()
  totalAmount: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  hours?: number;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  percentage?: number;
}
