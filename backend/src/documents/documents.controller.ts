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
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  findAll(
    @Query('clientId') clientId?: string,
    @Query('caseId') caseId?: string,
    @Query('search') search?: string,
  ): Promise<Document[]> {
    return this.documentsService.findAll({
      clientId: clientId || undefined,
      caseId: caseId || undefined,
      search: search || undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Document> {
    return this.documentsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDocumentDto): Promise<Document> {
    return this.documentsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<Document> {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
