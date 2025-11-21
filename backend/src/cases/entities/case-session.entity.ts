import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Case } from './case.entity';

@Entity('case_sessions')
export class CaseSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  result?: string;

  @Column({ nullable: true })
  notes?: string;

  @ManyToOne(() => Case, (legalCase) => legalCase.sessions, {
    onDelete: 'CASCADE',
  })
  legalCase: Case;
}
