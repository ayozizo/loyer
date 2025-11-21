import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { Case } from '../cases/entities/case.entity';
import { User } from '../users/entities/user.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Case)
    private readonly casesRepository: Repository<Case>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateDocumentDto): Promise<Document> {
    const [client, legalCase, uploadedBy] = await Promise.all([
      dto.clientId
        ? this.clientsRepository.findOne({ where: { id: dto.clientId } })
        : Promise.resolve(null),
      dto.caseId
        ? this.casesRepository.findOne({ where: { id: dto.caseId } })
        : Promise.resolve(null),
      dto.uploadedById
        ? this.usersRepository.findOne({ where: { id: dto.uploadedById } })
        : Promise.resolve(null),
    ]);

    const entity = this.documentsRepository.create({
      title: dto.title,
      type: dto.type,
      fileUrl: dto.fileUrl,
      originalFileName: dto.originalFileName,
      mimeType: dto.mimeType,
      description: dto.description,
      textContent: dto.textContent,
      tags: dto.tags ?? [],
      client: client ?? undefined,
      legalCase: legalCase ?? undefined,
      uploadedBy: uploadedBy ?? undefined,
    });

    return this.documentsRepository.save(entity);
  }

  findAll(params?: {
    clientId?: string;
    caseId?: string;
    search?: string;
  }): Promise<Document[]> {
    if (params?.search) {
      const search = `%${params.search}%`;
      return this.documentsRepository.find({
        where: [
          { title: ILike(search) },
          { description: ILike(search) },
          { textContent: ILike(search) },
        ],
        order: { createdAt: 'DESC' },
      });
    }

    const where: any = {};
    if (params?.clientId) {
      where.client = { id: params.clientId };
    }
    if (params?.caseId) {
      where.legalCase = { id: params.caseId };
    }

    return this.documentsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentsRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<Document> {
    const document = await this.findOne(id);

    if (dto.clientId) {
      const client = await this.clientsRepository.findOne({
        where: { id: dto.clientId },
      });
      document.client = client ?? undefined;
    }

    if (dto.caseId) {
      const legalCase = await this.casesRepository.findOne({
        where: { id: dto.caseId },
      });
      document.legalCase = legalCase ?? undefined;
    }

    if (dto.uploadedById) {
      const user = await this.usersRepository.findOne({
        where: { id: dto.uploadedById },
      });
      document.uploadedBy = user ?? undefined;
    }

    const { clientId, caseId, uploadedById, ...rest } = dto;
    Object.assign(document, rest);

    if (dto.tags) {
      document.tags = dto.tags;
    }

    return this.documentsRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    await this.documentsRepository.delete(id);
  }
}
