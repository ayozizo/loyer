import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CasesService } from './cases.service';
import { Case } from './entities/case.entity';
import { CaseSession } from './entities/case-session.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateCaseSessionDto } from './dto/create-case-session.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  findAll(): Promise<Case[]> {
    return this.casesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Case> {
    return this.casesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCaseDto): Promise<Case> {
    return this.casesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCaseDto): Promise<Case> {
    return this.casesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.casesService.remove(id);
  }

  @Get(':id/sessions')
  listSessions(@Param('id') id: string): Promise<CaseSession[]> {
    return this.casesService.listSessions(id);
  }

  @Post(':id/sessions')
  addSession(
    @Param('id') id: string,
    @Body() dto: CreateCaseSessionDto,
  ): Promise<CaseSession> {
    return this.casesService.addSession(id, dto);
  }
}
