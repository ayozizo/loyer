import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from '../cases/entities/case.entity';
import { Client } from '../clients/entities/client.entity';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Payment, Client, Case])],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
