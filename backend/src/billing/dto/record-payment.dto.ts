import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Currency } from '../entities/invoice.entity';

export class RecordPaymentDto {
  @IsNumber()
  amount: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsDateString()
  paidAt: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  reference?: string;
}
