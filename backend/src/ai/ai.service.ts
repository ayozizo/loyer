import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from '../documents/entities/document.entity';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
  ) {}

  async summarizeText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      return { summary: '' };
    }
    const max = 300;
    if (trimmed.length <= max) {
      return { summary: trimmed };
    }
    return { summary: trimmed.slice(0, max) + '...' };
  }

  async summarizeDocument(documentId: string) {
    const doc = await this.documentsRepository.findOne({ where: { id: documentId } });
    if (!doc || !doc.textContent) {
      return { summary: '', documentId };
    }
    return this.summarizeText(doc.textContent);
  }

  async generateCaseMemo(input: { caseSummary: string }) {
    const base = input.caseSummary || '';
    return {
      sections: [
        {
          title: 'ملخص الوقائع',
          body: base,
        },
        {
          title: 'الدفاع المقترح',
          body: 'هذه مسودة دفاع مقترحة مبنية على ملخص القضية. يمكن للمحامي تعديلها حسب الحاجة.',
        },
        {
          title: 'الطلبات المحتملة',
          body: 'تحديد الطلبات الختامية بحسب نوع القضية وهدف الموكل.',
        },
      ],
    };
  }

  async analyzeClientSentiment(input: { interactions: { channel: string; text: string }[] }) {
    return {
      score: 0.5,
      label: 'NEUTRAL',
      notes: 'هذه نتيجة تقريبية (stub). يمكن ربطها لاحقًا بنموذج ذكاء اصطناعي فعلي لتحليل الانطباع.',
    };
  }
}
