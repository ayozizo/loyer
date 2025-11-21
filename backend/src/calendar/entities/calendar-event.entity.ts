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

export enum CalendarEventType {
  SESSION = 'SESSION',
  MEETING = 'MEETING',
  DEADLINE = 'DEADLINE',
  OTHER = 'OTHER',
}

@Entity('calendar_events')
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: CalendarEventType })
  type: CalendarEventType;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endAt?: Date;

  @Column({ default: false })
  isAllDay: boolean;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Client, { nullable: true, eager: true })
  client?: Client | null;

  @ManyToOne(() => Case, { nullable: true, eager: true })
  legalCase?: Case | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  assignedTo?: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
