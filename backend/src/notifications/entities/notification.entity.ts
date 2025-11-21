import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Case } from '../../cases/entities/case.entity';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column()
  type: string;

  @Column({ nullable: true })
  targetEmail?: string;

  @Column({ nullable: true })
  targetPhone?: string;

  @Column({ nullable: true })
  targetWhatsapp?: string;

  @ManyToOne(() => User, { nullable: true, eager: true })
  user?: User | null;

  @ManyToOne(() => Client, { nullable: true, eager: true })
  client?: Client | null;

  @ManyToOne(() => Case, { nullable: true, eager: true })
  legalCase?: Case | null;

  @Column({ type: 'jsonb', nullable: true })
  payload?: any;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
