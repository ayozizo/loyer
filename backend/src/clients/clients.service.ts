import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  create(data: Partial<Client>): Promise<Client> {
    const entity = this.clientsRepository.create(data);
    return this.clientsRepository.save(entity);
  }

  findAll(): Promise<Client[]> {
    return this.clientsRepository.find();
  }

  findOne(id: string): Promise<Client | null> {
    return this.clientsRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Client>): Promise<Client | null> {
    const client = await this.findOne(id);
    if (!client) {
      return null;
    }
    Object.assign(client, data);
    return this.clientsRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    await this.clientsRepository.delete(id);
  }
}
