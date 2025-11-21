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

export enum DocumentType {
  PLEADING = 'PLEADING',
  JUDGMENT = 'JUDGMENT',
  POWER_OF_ATTORNEY = 'POWER_OF_ATTORNEY',
  CONTRACT = 'CONTRACT',
  CORRESPONDENCE = 'CORRESPONDENCE',
  OTHER = 'OTHER',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  type: DocumentType;

  @Column()
  fileUrl: string;

  @Column({ nullable: true })
  originalFileName?: string;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  textContent?: string;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @ManyToOne(() => Client, { nullable: true, eager: true })
  client?: Client | null;

  @ManyToOne(() => Case, { nullable: true, eager: true })
  legalCase?: Case | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  uploadedBy?: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
