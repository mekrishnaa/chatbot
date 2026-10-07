export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  text: string;
  pages?: ExtractedPage[];
}

export interface DocumentParser {
  supports(mimeType: string, filename: string): boolean;
  extractText(filePath: string, buffer?: Buffer): Promise<ExtractedDocument>;
}

export const DOCUMENT_PARSER_REGISTRY = 'DOCUMENT_PARSER_REGISTRY';

