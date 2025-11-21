import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case, CaseStage, CaseStatus, CaseType } from '../cases/entities/case.entity';
import { CaseSession } from '../cases/entities/case-session.entity';
import { Client } from '../clients/entities/client.entity';
import { Invoice } from '../billing/entities/invoice.entity';
import { Payment } from '../billing/entities/payment.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Case)
    private readonly casesRepository: Repository<Case>,
    @InjectRepository(CaseSession)
    private readonly sessionsRepository: Repository<CaseSession>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  async getCasesOverview() {
    const cases = await this.casesRepository.find();

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byStage: Record<string, number> = {};

    for (const c of cases) {
      byStatus[c.status] = (byStatus[c.status] ?? 0) + 1;
      byType[c.type] = (byType[c.type] ?? 0) + 1;
      byStage[c.stage] = (byStage[c.stage] ?? 0) + 1;
    }

    return {
      total: cases.length,
      byStatus,
      byType,
      byStage,
    };
  }

  async getFinancialOverview(params?: { from?: string; to?: string }) {
    const invoices = await this.invoicesRepository.find({ relations: ['payments'] });

    let totalInvoiced = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let overdue = 0;

    const now = new Date();

    for (const invoice of invoices) {
      if (params?.from || params?.to) {
        const createdAt = (invoice as any).createdAt as Date | undefined;
        if (createdAt) {
          if (params.from && createdAt < new Date(params.from)) continue;
          if (params.to && createdAt > new Date(params.to)) continue;
        }
      }

      totalInvoiced += invoice.totalAmount;
      const paid =
        invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
      totalPaid += paid;

      const remaining = invoice.totalAmount - paid;
      if (remaining > 0) {
        outstanding += remaining;
        if (invoice.dueDate && invoice.dueDate.getTime() < now.getTime()) {
          overdue += remaining;
        }
      }
    }

    return {
      totalInvoiced,
      totalPaid,
      outstanding,
      overdue,
    };
  }

  async getTopCaseTypesByRevenue() {
    const invoices = await this.invoicesRepository.find({ relations: ['legalCase'] });

    const map = new Map<string, number>();

    for (const inv of invoices) {
      const type = inv.legalCase?.type ?? CaseType.OTHER;
      map.set(type, (map.get(type) ?? 0) + inv.totalAmount);
    }

    const items = Array.from(map.entries()).map(([type, total]) => ({
      type,
      total,
    }));

    items.sort((a, b) => b.total - a.total);

    return items;
  }

  async getTeamPerformance() {
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
      if (!userId) continue;
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

  async getClientProfitability() {
    const clients = await this.clientsRepository.find();
    const invoices = await this.invoicesRepository.find({ relations: ['client'] });
    const payments = await this.paymentsRepository.find({ relations: ['invoice', 'invoice.client'] });

    const byClient = new Map<
      string,
      {
        clientId: string;
        clientName: string;
        totalInvoiced: number;
        totalPaid: number;
      }
    >();

    for (const client of clients) {
      byClient.set(client.id, {
        clientId: client.id,
        clientName: client.name,
        totalInvoiced: 0,
        totalPaid: 0,
      });
    }

    for (const inv of invoices) {
      const clientId = inv.client?.id;
      if (!clientId) continue;
      const entry = byClient.get(clientId);
      if (!entry) continue;
      entry.totalInvoiced += inv.totalAmount;
    }

    for (const p of payments) {
      const clientId = p.invoice?.client?.id;
      if (!clientId) continue;
      const entry = byClient.get(clientId);
      if (!entry) continue;
      entry.totalPaid += p.amount;
    }

    return Array.from(byClient.values()).map((c) => ({
      ...c,
      outstanding: c.totalInvoiced - c.totalPaid,
    }));
  }

  async getDashboardOverview() {
    const [casesOverview, financialOverview, teamPerformance, topCaseTypes, clientProfitability] =
      await Promise.all([
        this.getCasesOverview(),
        this.getFinancialOverview(),
        this.getTeamPerformance(),
        this.getTopCaseTypesByRevenue(),
        this.getClientProfitability(),
      ]);

    return {
      casesOverview,
      financialOverview,
      teamPerformance,
      topCaseTypes,
      clientProfitability,
    };
  }
}
