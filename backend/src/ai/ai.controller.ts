import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize-text')
  summarizeText(@Body() body: { text: string }) {
    return this.aiService.summarizeText(body.text ?? '');
  }

  @Post('summarize-document')
  summarizeDocument(@Body() body: { documentId: string }) {
    return this.aiService.summarizeDocument(body.documentId);
  }

  @Post('generate-case-memo')
  generateCaseMemo(@Body() body: { caseSummary: string }) {
    return this.aiService.generateCaseMemo({ caseSummary: body.caseSummary ?? '' });
  }

  @Post('analyze-client-sentiment')
  analyzeClientSentiment(
    @Body() body: { interactions: { channel: string; text: string }[] },
  ) {
    return this.aiService.analyzeClientSentiment({ interactions: body.interactions ?? [] });
  }
}
