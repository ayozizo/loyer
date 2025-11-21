import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../billing/entities/invoice.entity';
import { Payment } from '../billing/entities/payment.entity';
import { Case } from '../cases/entities/case.entity';
import { CaseSession } from '../cases/entities/case-session.entity';
import { Client } from '../clients/entities/client.entity';
import { Task } from '../tasks/entities/task.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Case,
      CaseSession,
      Client,
      Invoice,
      Payment,
      Task,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
