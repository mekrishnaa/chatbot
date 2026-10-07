import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import { DocumentParser, ExtractedDocument, ExtractedPage } from './parser.interface';

@Injectable()
export class PdfParser implements DocumentParser {
  private readonly logger = new Logger(PdfParser.name);

  supports(mimeType: string, filename: string): boolean {
    const ext = filename.toLowerCase().split('.').pop() || '';
    return mimeType === 'application/pdf' || ext === 'pdf';
  }

  async extractText(filePath: string, buffer?: Buffer): Promise<ExtractedDocument> {
    const rawBuffer = buffer || (await fs.readFile(filePath));
    // Dynamic import to prevent issues with pdf-parse native bindings/packaging
    const pdfParse = require('pdf-parse');

    const pages: ExtractedPage[] = [];
    let pageCount = 0;

    try {
      const renderOptions = {
        pagerender: (pageData: any) => {
          return pageData.getTextContent().then((textContent: any) => {
            pageCount++;
            const currentPageNum = pageCount;
            let lastY: number | undefined;
            let text = '';
            for (const item of textContent.items) {
              if (lastY === item.transform[5] || lastY === undefined) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            if (text.trim().length > 0) {
              pages.push({
                pageNumber: currentPageNum,
                text: text.trim(),
              });
            }
            return text;
          });
        },
      };

      const parsed = await pdfParse(rawBuffer, renderOptions);
      const fullText = parsed.text ? parsed.text.trim() : '';

      return {
        text: fullText,
        pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: fullText }],
      };
    } catch (err) {
      this.logger.warn(`Per-page rendering failed, falling back to standard extraction: ${err.message}`);
      const fallback = await pdfParse(rawBuffer);
      const fullText = (fallback.text || '').trim();
      return {
        text: fullText,
        pages: [{ pageNumber: 1, text: fullText }],
      };
    }
  }
}

