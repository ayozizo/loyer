import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { CaseSession } from '../cases/entities/case-session.entity';
import { Notification, NotificationChannel, NotificationStatus } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    @InjectRepository(CaseSession)
    private readonly sessionsRepository: Repository<CaseSession>,
  ) {}

  findAll(): Promise<Notification[]> {
    return this.notificationsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async previewUpcomingCaseSessions(hoursAhead = 24) {
    const now = new Date();
    const to = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const sessions = await this.sessionsRepository.find({
      where: {
        date: MoreThan(now),
      },
      order: { date: 'ASC' },
      relations: ['legalCase', 'legalCase.client'],
    });

    const upcoming = sessions.filter((s) => s.date <= to);

    return upcoming.map((s) => ({
      sessionId: s.id,
      caseId: s.legalCase?.id,
      caseNumber: s.legalCase?.caseNumber,
      clientName: s.legalCase?.client?.name,
      date: s.date,
      location: s.location,
    }));
  }

  async create(notification: Partial<Notification>): Promise<Notification> {
    const entity = this.notificationsRepository.create(notification);
    return this.notificationsRepository.save(entity);
  }

  async markSent(id: string): Promise<Notification | null> {
    const entity = await this.notificationsRepository.findOne({ where: { id } });
    if (!entity) return null;
    entity.status = NotificationStatus.SENT;
    entity.sentAt = new Date();
    return this.notificationsRepository.save(entity);
  }

  async simulateSend(id: string): Promise<Notification | null> {
    const entity = await this.notificationsRepository.findOne({ where: { id } });
    if (!entity) return null;
    entity.status = NotificationStatus.SENT;
    entity.sentAt = new Date();
    return this.notificationsRepository.save(entity);
  }
}
