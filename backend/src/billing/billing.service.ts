import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from '../cases/entities/case.entity';
import { Client } from '../clients/entities/client.entity';
import { BillingModel, Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(Case)
    private readonly casesRepository: Repository<Case>,
  ) {}

  async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    const client = await this.clientsRepository.findOne({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    let legalCase: Case | null = null;
    if (dto.caseId) {
      legalCase = await this.casesRepository.findOne({
        where: { id: dto.caseId },
      });
      if (!legalCase) {
        throw new NotFoundException('Case not found');
      }
    }

    const invoice = this.invoicesRepository.create({
      client,
      legalCase: legalCase ?? undefined,
      billingModel: dto.billingModel,
      totalAmount: dto.totalAmount,
      currency: dto.currency,
      status: dto.status ?? InvoiceStatus.DRAFT,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      description: dto.description,
      hours: dto.hours,
      hourlyRate: dto.hourlyRate,
      percentage: dto.percentage,
    });

    return this.invoicesRepository.save(invoice);
  }

  findAllInvoices(params?: {
    clientId?: string;
    caseId?: string;
    status?: InvoiceStatus;
  }): Promise<Invoice[]> {
    const where: any = {};

    if (params?.clientId) {
      where.client = { id: params.clientId };
    }

    if (params?.caseId) {
      where.legalCase = { id: params.caseId };
    }

    if (params?.status) {
      where.status = params.status;
    }

    return this.invoicesRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOneInvoice(id);

    if (dto.clientId) {
      const client = await this.clientsRepository.findOne({
        where: { id: dto.clientId },
      });
      if (!client) {
        throw new NotFoundException('Client not found');
      }
      invoice.client = client;
    }

    if (dto.caseId) {
      const legalCase = await this.casesRepository.findOne({
        where: { id: dto.caseId },
      });
      if (!legalCase) {
        throw new NotFoundException('Case not found');
      }
      invoice.legalCase = legalCase;
    }

    const { clientId, caseId, ...rest } = dto;
    Object.assign(invoice, rest);

    if (dto.dueDate) {
      invoice.dueDate = new Date(dto.dueDate);
    }

    return this.invoicesRepository.save(invoice);
  }

  async removeInvoice(id: string): Promise<void> {
    await this.invoicesRepository.delete(id);
  }

  async listPaymentsForInvoice(invoiceId: string): Promise<Payment[]> {
    const invoice = await this.findOneInvoice(invoiceId);
    return this.paymentsRepository.find({
      where: { invoice: { id: invoice.id } },
      order: { paidAt: 'DESC' },
    });
  }

  async recordPayment(
    invoiceId: string,
    dto: RecordPaymentDto,
  ): Promise<Payment> {
    const invoice = await this.findOneInvoice(invoiceId);

    const payment = this.paymentsRepository.create({
      invoice,
      amount: dto.amount,
      currency: dto.currency,
      paidAt: new Date(dto.paidAt),
      method: dto.method,
      reference: dto.reference,
    });

    const saved = await this.paymentsRepository.save(payment);

    const payments = await this.paymentsRepository.find({
      where: { invoice: { id: invoice.id } },
    });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    if (totalPaid >= invoice.totalAmount) {
      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = payment.paidAt;
    } else if (totalPaid > 0) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    const now = new Date();
    if (
      invoice.status !== InvoiceStatus.PAID &&
      invoice.dueDate &&
      invoice.dueDate.getTime() < now.getTime()
    ) {
      invoice.status = InvoiceStatus.OVERDUE;
    }

    await this.invoicesRepository.save(invoice);

    return saved;
  }

  async getSummary(): Promise<{
    totalInvoiced: number;
    totalPaid: number;
    outstanding: number;
    overdue: number;
  }> {
    const invoices = await this.invoicesRepository.find({
      relations: ['payments'],
    });

    let totalInvoiced = 0;
    let totalPaid = 0;
    let outstanding = 0;
    let overdue = 0;

    const now = new Date();

    for (const invoice of invoices) {
      totalInvoiced += invoice.totalAmount;
      const paidForInvoice =
        invoice.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
      totalPaid += paidForInvoice;

      const remaining = invoice.totalAmount - paidForInvoice;
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
}
