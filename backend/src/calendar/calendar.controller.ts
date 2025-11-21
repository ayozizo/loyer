import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEvent } from './entities/calendar-event.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('clientId') clientId?: string,
    @Query('caseId') caseId?: string,
    @Query('assignedToId') assignedToId?: string,
  ): Promise<CalendarEvent[]> {
    return this.calendarService.findAll({
      from: from || undefined,
      to: to || undefined,
      clientId: clientId || undefined,
      caseId: caseId || undefined,
      assignedToId: assignedToId || undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CalendarEvent> {
    return this.calendarService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCalendarEventDto): Promise<CalendarEvent> {
    return this.calendarService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
  ): Promise<CalendarEvent> {
    return this.calendarService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.calendarService.remove(id);
  }

  @Get('suggest/slots')
  suggestSlots(
    @Query('date') date: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.calendarService.suggestSlots({ date, assignedToId });
  }
}
