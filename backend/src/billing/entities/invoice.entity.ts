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
import { Case } from '../../cases/entities/case.entity';
import { Payment } from './payment.entity';

export enum Currency {
  SAR = 'SAR',
  USD = 'USD',
  EGP = 'EGP',
  EUR = 'EUR',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum BillingModel {
  HOURLY = 'HOURLY',
  FIXED = 'FIXED',
  CONTINGENCY = 'CONTINGENCY',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Client, { eager: true })
  client: Client;

  @ManyToOne(() => Case, { nullable: true, eager: true })
  legalCase?: Case | null;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Column({ type: 'enum', enum: BillingModel })
  billingModel: BillingModel;

  @Column({ type: 'float' })
  totalAmount: number;

  @Column({ type: 'enum', enum: Currency, default: Currency.SAR })
  currency: Currency;

  @Column({ type: 'timestamptz', nullable: true })
  dueDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'float', nullable: true })
  hours?: number;

  @Column({ type: 'float', nullable: true })
  hourlyRate?: number;

  @Column({ type: 'float', nullable: true })
  percentage?: number;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
