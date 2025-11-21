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
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('invoices')
  findAllInvoices(
    @Query('clientId') clientId?: string,
    @Query('caseId') caseId?: string,
    @Query('status') status?: InvoiceStatus,
  ): Promise<Invoice[]> {
    return this.billingService.findAllInvoices({
      clientId: clientId || undefined,
      caseId: caseId || undefined,
      status: status || undefined,
    });
  }

  @Get('invoices/:id')
  findOneInvoice(@Param('id') id: string): Promise<Invoice> {
    return this.billingService.findOneInvoice(id);
  }

  @Post('invoices')
  createInvoice(@Body() dto: CreateInvoiceDto): Promise<Invoice> {
    return this.billingService.createInvoice(dto);
  }

  @Patch('invoices/:id')
  updateInvoice(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    return this.billingService.updateInvoice(id, dto);
  }

  @Delete('invoices/:id')
  removeInvoice(@Param('id') id: string) {
    return this.billingService.removeInvoice(id);
  }

  @Get('invoices/:id/payments')
  listPayments(@Param('id') id: string): Promise<Payment[]> {
    return this.billingService.listPaymentsForInvoice(id);
  }

  @Post('invoices/:id/payments')
  recordPayment(
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ): Promise<Payment> {
    return this.billingService.recordPayment(id, dto);
  }

  @Get('summary')
  getSummary() {
    return this.billingService.getSummary();
  }
}
