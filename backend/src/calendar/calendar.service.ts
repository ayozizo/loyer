import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Case } from '../cases/entities/case.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEvent } from './entities/calendar-event.entity';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly eventsRepository: Repository<CalendarEvent>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Case)
    private readonly casesRepository: Repository<Case>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(dto: CreateCalendarEventDto): Promise<CalendarEvent> {
    const [client, legalCase, assignedTo] = await Promise.all([
      dto.clientId
        ? this.clientsRepository.findOne({ where: { id: dto.clientId } })
        : Promise.resolve(null),
      dto.caseId
        ? this.casesRepository.findOne({ where: { id: dto.caseId } })
        : Promise.resolve(null),
      dto.assignedToId
        ? this.usersRepository.findOne({ where: { id: dto.assignedToId } })
        : Promise.resolve(null),
    ]);

    const entity = this.eventsRepository.create({
      title: dto.title,
      type: dto.type,
      startAt: new Date(dto.startAt),
      endAt: dto.endAt ? new Date(dto.endAt) : undefined,
      isAllDay: dto.isAllDay ?? false,
      location: dto.location,
      description: dto.description,
      client: client ?? undefined,
      legalCase: legalCase ?? undefined,
      assignedTo: assignedTo ?? undefined,
    });

    return this.eventsRepository.save(entity);
  }

  findAll(params?: {
    from?: string;
    to?: string;
    clientId?: string;
    caseId?: string;
    assignedToId?: string;
  }): Promise<CalendarEvent[]> {
    const where: any = {};

    if (params?.clientId) {
      where.client = { id: params.clientId };
    }
    if (params?.caseId) {
      where.legalCase = { id: params.caseId };
    }
    if (params?.assignedToId) {
      where.assignedTo = { id: params.assignedToId };
    }

    if (params?.from && params?.to) {
      where.startAt = Between(new Date(params.from), new Date(params.to));
    }

    return this.eventsRepository.find({
      where,
      order: { startAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<CalendarEvent> {
    const event = await this.eventsRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Calendar event not found');
    }
    return event;
  }

  async update(
    id: string,
    dto: UpdateCalendarEventDto,
  ): Promise<CalendarEvent> {
    const event = await this.findOne(id);

    if (dto.clientId) {
      const client = await this.clientsRepository.findOne({
        where: { id: dto.clientId },
      });
      event.client = client ?? undefined;
    }

    if (dto.caseId) {
      const legalCase = await this.casesRepository.findOne({
        where: { id: dto.caseId },
      });
      event.legalCase = legalCase ?? undefined;
    }

    if (dto.assignedToId) {
      const assignedTo = await this.usersRepository.findOne({
        where: { id: dto.assignedToId },
      });
      event.assignedTo = assignedTo ?? undefined;
    }

    const { clientId, caseId, assignedToId, ...rest } = dto;

    if (dto.startAt) {
      (rest as any).startAt = new Date(dto.startAt);
    }
    if (dto.endAt) {
      (rest as any).endAt = new Date(dto.endAt);
    }

    Object.assign(event, rest);

    return this.eventsRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    await this.eventsRepository.delete(id);
  }

  async suggestSlots(params: {
    date: string;
    assignedToId?: string;
  }): Promise<{ startAt: string; endAt: string }[]> {
    const day = new Date(params.date);
    const startOfDay = new Date(day);
    startOfDay.setHours(9, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(17, 0, 0, 0);

    const events = await this.eventsRepository.find({
      where: {
        ...(params.assignedToId
          ? { assignedTo: { id: params.assignedToId } }
          : {}),
        startAt: Between(startOfDay, endOfDay),
      },
      order: { startAt: 'ASC' },
    });

    const slots: { startAt: Date; endAt: Date }[] = [];

    let cursor = startOfDay;
    for (const event of events) {
      if (event.startAt.getTime() - cursor.getTime() >= 30 * 60 * 1000) {
        const slotEnd = new Date(cursor.getTime() + 60 * 60 * 1000);
        if (slotEnd <= event.startAt) {
          slots.push({ startAt: new Date(cursor), endAt: slotEnd });
        }
      }
      if (event.endAt && event.endAt > cursor) {
        cursor = new Date(event.endAt);
      }
    }

    if (endOfDay.getTime() - cursor.getTime() >= 30 * 60 * 1000) {
      const slotEnd = new Date(cursor.getTime() + 60 * 60 * 1000);
      if (slotEnd <= endOfDay) {
        slots.push({ startAt: new Date(cursor), endAt: slotEnd });
      }
    }

    return slots.map((s) => ({
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
    }));
  }
}
