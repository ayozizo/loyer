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
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  findAll(
    @Query('assignedToId') assignedToId?: string,
    @Query('caseId') caseId?: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: TaskPriority,
  ): Promise<Task[]> {
    return this.tasksService.findAll({
      assignedToId: assignedToId || undefined,
      caseId: caseId || undefined,
      clientId: clientId || undefined,
      status: status || undefined,
      priority: priority || undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }

  @Get('stats/users')
  getUserStats() {
    return this.tasksService.getUserStats();
  }
}
