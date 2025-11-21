import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { Case } from './entities/case.entity';
import { CaseSession } from './entities/case-session.entity';
import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';

@Module({
  imports: [TypeOrmModule.forFeature([Case, CaseSession, Client, User])],
  providers: [CasesService],
  controllers: [CasesController],
})
export class CasesModule {}
