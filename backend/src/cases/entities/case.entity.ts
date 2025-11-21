import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { CaseSession } from './case-session.entity';

export enum CaseType {
  CRIMINAL = 'CRIMINAL',
  COMMERCIAL = 'COMMERCIAL',
  PERSONAL_STATUS = 'PERSONAL_STATUS',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  LABOR = 'LABOR',
  OTHER = 'OTHER',
}

export enum CaseStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export enum CaseStage {
  PRE_TRIAL = 'PRE_TRIAL',
  FIRST_INSTANCE = 'FIRST_INSTANCE',
  APPEAL = 'APPEAL',
  SUPREME = 'SUPREME',
  EXECUTION = 'EXECUTION',
}

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  caseNumber: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ type: 'enum', enum: CaseType, default: CaseType.OTHER })
  type: CaseType;

  @Column({ nullable: true })
  court?: string;

  @Column({ type: 'enum', enum: CaseStage, default: CaseStage.PRE_TRIAL })
  stage: CaseStage;

  @Column({ type: 'enum', enum: CaseStatus, default: CaseStatus.OPEN })
  status: CaseStatus;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => Client, (client) => client.cases, { eager: true })
  client: Client;

  @ManyToOne(() => User, { eager: true, nullable: true })
  responsibleLawyer?: User;

  @OneToMany(() => CaseSession, (session: CaseSession) => session.legalCase, {
    cascade: true,
  })
  sessions: CaseSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
