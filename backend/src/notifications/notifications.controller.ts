import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(): Promise<Notification[]> {
    return this.notificationsService.findAll();
  }

  @Get('preview/case-sessions')
  previewUpcomingCaseSessions() {
    return this.notificationsService.previewUpcomingCaseSessions();
  }

  @Post()
  create(@Body() body: Partial<Notification>): Promise<Notification> {
    return this.notificationsService.create(body);
  }

  @Post(':id/simulate-send')
  simulateSend(@Param('id') id: string) {
    return this.notificationsService.simulateSend(id);
  }
}
