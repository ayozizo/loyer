import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Case } from '../../cases/entities/case.entity';

export enum ClientType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
  GOVERNMENT = 'GOVERNMENT',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ClientType, default: ClientType.INDIVIDUAL })
  type: ClientType;

  @Column({ nullable: true })
  nationalId?: string;

  @Column({ nullable: true })
  commercialRegistration?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  notes?: string;

  @OneToMany(() => Case, (legalCase: Case) => legalCase.client)
  cases: Case[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
