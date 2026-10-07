import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import { DocumentParser, ExtractedDocument } from './parser.interface';

@Injectable()
export class TxtParser implements DocumentParser {
  supports(mimeType: string, filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const textExtensions = ['txt', 'md', 'markdown', 'csv', 'json', 'yaml', 'yml', 'log'];
    return (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      textExtensions.includes(ext)
    );
  }

  async extractText(filePath: string, buffer?: Buffer): Promise<ExtractedDocument> {
    const rawBuffer = buffer || (await fs.readFile(filePath));
    const text = rawBuffer.toString('utf-8');
    return {
      text: text.trim(),
      pages: [
        {
          pageNumber: 1,
          text: text.trim(),
        },
      ],
    };
  }
}

