import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { Case } from './entities/case.entity';
import { CaseSession } from './entities/case-session.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateCaseSessionDto } from './dto/create-case-session.dto';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case)
    private readonly casesRepository: Repository<Case>,
    @InjectRepository(CaseSession)
    private readonly sessionsRepository: Repository<CaseSession>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateCaseDto): Promise<Case> {
    const client = await this.clientsRepository.findOne({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    let responsibleLawyer: User | undefined;
    if (dto.responsibleLawyerId) {
      const lawyer = await this.usersRepository.findOne({
        where: { id: dto.responsibleLawyerId },
      });
      if (lawyer) {
        responsibleLawyer = lawyer;
      }
    }

    const { clientId, responsibleLawyerId, ...rest } = dto;
    const entity = this.casesRepository.create({
      ...rest,
      client,
      responsibleLawyer,
    });
    return this.casesRepository.save(entity);
  }

  findAll(): Promise<Case[]> {
    return this.casesRepository.find({ relations: ['sessions'] });
  }

  async findOne(id: string): Promise<Case> {
    const legalCase = await this.casesRepository.findOne({
      where: { id },
      relations: ['sessions'],
    });
    if (!legalCase) {
      throw new NotFoundException('Case not found');
    }
    return legalCase;
  }

  async update(id: string, dto: UpdateCaseDto): Promise<Case> {
    const legalCase = await this.findOne(id);

    if (dto.clientId) {
      const client = await this.clientsRepository.findOne({
        where: { id: dto.clientId },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }
      legalCase.client = client;
    }

    if (dto.responsibleLawyerId) {
      const lawyer = await this.usersRepository.findOne({
        where: { id: dto.responsibleLawyerId },
      });
      legalCase.responsibleLawyer = lawyer ?? undefined;
    }

    const { clientId, responsibleLawyerId, ...rest } = dto;
    Object.assign(legalCase, rest);
    return this.casesRepository.save(legalCase);
  }

  async remove(id: string): Promise<void> {
    await this.casesRepository.delete(id);
  }

  async addSession(caseId: string, dto: CreateCaseSessionDto): Promise<CaseSession> {
    const legalCase = await this.findOne(caseId);
    const session = this.sessionsRepository.create({
      ...dto,
      date: new Date(dto.date),
      legalCase,
    });
    return this.sessionsRepository.save(session);
  }

  async listSessions(caseId: string): Promise<CaseSession[]> {
    const legalCase = await this.findOne(caseId);
    return legalCase.sessions ?? [];
  }
}
