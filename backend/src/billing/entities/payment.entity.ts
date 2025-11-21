import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Currency, Invoice } from './invoice.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.payments, {
    onDelete: 'CASCADE',
  })
  invoice: Invoice;

  @Column({ type: 'float' })
  amount: number;

  @Column({ type: 'varchar' })
  currency: Currency;

  @Column({ type: 'timestamptz' })
  paidAt: Date;

  @Column({ nullable: true })
  method?: string;

  @Column({ nullable: true })
  reference?: string;

  @CreateDateColumn()
  createdAt: Date;
}
