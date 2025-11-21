import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../cases/entities/case.entity';
import { Client } from '../clients/entities/client.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskPriority, TaskStatus } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Case)
    private readonly casesRepository: Repository<Case>,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const [assignedTo, createdBy, client, legalCase] = await Promise.all([
      this.usersRepository.findOne({ where: { id: dto.assignedToId } }),
      this.usersRepository.findOne({ where: { id: dto.createdById } }),
      dto.clientId
        ? this.clientsRepository.findOne({ where: { id: dto.clientId } })
        : Promise.resolve(null),
      dto.caseId
        ? this.casesRepository.findOne({ where: { id: dto.caseId } })
        : Promise.resolve(null),
    ]);

    if (!assignedTo) {
      throw new NotFoundException('Assigned user not found');
    }
    if (!createdBy) {
      throw new NotFoundException('Creator user not found');
    }

    const entity = this.tasksRepository.create({
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TaskStatus.TODO,
      priority: dto.priority ?? TaskPriority.MEDIUM,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignedTo,
      createdBy,
      client: client ?? undefined,
      legalCase: legalCase ?? undefined,
    });

    return this.tasksRepository.save(entity);
  }

  findAll(params?: {
    assignedToId?: string;
    caseId?: string;
    clientId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
  }): Promise<Task[]> {
    const where: any = {};

    if (params?.assignedToId) {
      where.assignedTo = { id: params.assignedToId };
    }
    if (params?.caseId) {
      where.legalCase = { id: params.caseId };
    }
    if (params?.clientId) {
      where.client = { id: params.clientId };
    }
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.priority) {
      where.priority = params.priority;
    }

    return this.tasksRepository.find({
      where,
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    if (dto.assignedToId) {
      const assignedTo = await this.usersRepository.findOne({
        where: { id: dto.assignedToId },
      });
      if (!assignedTo) {
        throw new NotFoundException('Assigned user not found');
      }
      task.assignedTo = assignedTo;
    }

    if (dto.caseId) {
      const legalCase = await this.casesRepository.findOne({
        where: { id: dto.caseId },
      });
      task.legalCase = legalCase ?? undefined;
    }

    if (dto.clientId) {
      const client = await this.clientsRepository.findOne({
        where: { id: dto.clientId },
      });
      task.client = client ?? undefined;
    }

    const { assignedToId, caseId, clientId, ...rest } = dto;

    if (dto.dueDate) {
      (rest as any).dueDate = new Date(dto.dueDate);
    }

    const previousStatus = task.status;
    Object.assign(task, rest);

    if (
      task.status === TaskStatus.DONE &&
      previousStatus !== TaskStatus.DONE &&
      !task.completedAt
    ) {
      task.completedAt = new Date();
    }

    return this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    await this.tasksRepository.delete(id);
  }

  async getUserStats(): Promise<
    {
      userId: string;
      fullName?: string;
      openTasks: number;
      completedTasks: number;
      overdueTasks: number;
    }[]
  > {
    const tasks = await this.tasksRepository.find();
    const now = new Date();

    const map = new Map<
      string,
      {
        userId: string;
        fullName?: string;
        openTasks: number;
        completedTasks: number;
        overdueTasks: number;
      }
    >();

    for (const task of tasks) {
      const userId = task.assignedTo?.id;
      if (!userId) {
        continue;
      }
      if (!map.has(userId)) {
        map.set(userId, {
          userId,
          fullName: task.assignedTo?.fullName,
          openTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
        });
      }
      const entry = map.get(userId)!;
      if (task.status === TaskStatus.DONE) {
        entry.completedTasks += 1;
      } else {
        entry.openTasks += 1;
        if (task.dueDate && task.dueDate.getTime() < now.getTime()) {
          entry.overdueTasks += 1;
        }
      }
    }

    return Array.from(map.values());
  }
}
