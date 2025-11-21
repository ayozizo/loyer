import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';

@UseGuards(AuthGuard('jwt'))
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('cases-overview')
  getCasesOverview() {
    return this.reportsService.getCasesOverview();
  }

  @Get('financial-overview')
  getFinancialOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getFinancialOverview({ from, to });
  }

  @Get('team-performance')
  getTeamPerformance() {
    return this.reportsService.getTeamPerformance();
  }

  @Get('client-profitability')
  getClientProfitability() {
    return this.reportsService.getClientProfitability();
  }

  @Get('top-case-types')
  getTopCaseTypes() {
    return this.reportsService.getTopCaseTypesByRevenue();
  }

  @Get('dashboard')
  getDashboardOverview() {
    return this.reportsService.getDashboardOverview();
  }
}
