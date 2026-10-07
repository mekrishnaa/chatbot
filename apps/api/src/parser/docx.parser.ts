import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { DocumentParser, ExtractedDocument } from './parser.interface';

@Injectable()
export class DocxParser implements DocumentParser {
  supports(mimeType: string, filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop() || '';
    return (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ext === 'docx'
    );
  }

  async extractText(filePath: string, buffer?: Buffer): Promise<ExtractedDocument> {
    const rawBuffer = buffer || (await fs.readFile(filePath));
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: rawBuffer });
    const text = (result.value || '').trim();

    return {
      text,
      pages: [
        {
          pageNumber: 1,
          text,
        },
      ],
    };
  }
}

