import { Module } from '@nestjs/common';
import { TxtParser } from './txt.parser';
import { PdfParser } from './pdf.parser';
import { DocxParser } from './docx.parser';
import { DOCUMENT_PARSER_REGISTRY, DocumentParser } from './parser.interface';

@Module({
  providers: [
    TxtParser,
    PdfParser,
    DocxParser,
    {
      provide: DOCUMENT_PARSER_REGISTRY,
      useFactory: (...parsers: DocumentParser[]) => parsers,
      inject: [TxtParser, PdfParser, DocxParser],
    },
  ],
  exports: [DOCUMENT_PARSER_REGISTRY, TxtParser, PdfParser, DocxParser],
})
export class ParserModule {}

