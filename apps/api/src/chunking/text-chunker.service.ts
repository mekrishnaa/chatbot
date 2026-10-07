import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ChunkInput,
  DocumentChunk,
  ChunkingOptions,
} from './chunking.interface';

@Injectable()
export class TextChunkerService {
  private readonly logger = new Logger(TextChunkerService.name);
  private readonly defaultChunkSize: number;
  private readonly defaultChunkOverlap: number;

  constructor(private readonly configService: ConfigService) {
    this.defaultChunkSize = parseInt(
      this.configService.get<string>('CHUNK_SIZE', '600'),
      10,
    );
    this.defaultChunkOverlap = parseInt(
      this.configService.get<string>('CHUNK_OVERLAP', '80'),
      10,
    );
  }

  chunk(input: ChunkInput, customOptions?: Partial<ChunkingOptions>): DocumentChunk[] {
    const options: ChunkingOptions = {
      chunkSize: customOptions?.chunkSize ?? this.defaultChunkSize,
      chunkOverlap: customOptions?.chunkOverlap ?? this.defaultChunkOverlap,
    };

    const chunks: DocumentChunk[] = [];
    let globalIndex = 0;

    if (input.pages && input.pages.length > 0) {
      for (const page of input.pages) {
        if (!page.text || page.text.trim().length === 0) continue;
        const pageChunks = this.splitText(page.text, options);
        for (const textChunk of pageChunks) {
          chunks.push({
            documentId: input.documentId,
            organizationId: input.organizationId,
            content: textChunk,
            chunkIndex: globalIndex++,
            pageNumber: page.pageNumber,
            metadata: {
              ...input.metadata,
              pageNumber: page.pageNumber,
            },
          });
        }
      }
    } else {
      const textChunks = this.splitText(input.text, options);
      for (const textChunk of textChunks) {
        chunks.push({
          documentId: input.documentId,
          organizationId: input.organizationId,
          content: textChunk,
          chunkIndex: globalIndex++,
          pageNumber: null,
          metadata: input.metadata,
        });
      }
    }

    this.logger.log(
      `Chunked document ${input.documentId} into ${chunks.length} chunks (target size: ${options.chunkSize}, overlap: ${options.chunkOverlap})`,
    );

    return chunks;
  }

  /**
   * Splits text into overlapping chunks, attempting to break cleanly at paragraph
   * or sentence boundaries.
   */
  private splitText(text: string, options: ChunkingOptions): string[] {
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) return [];

    if (normalized.length <= options.chunkSize) {
      return [normalized];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < normalized.length) {
      let end = start + options.chunkSize;

      if (end >= normalized.length) {
        const lastChunk = normalized.substring(start).trim();
        if (lastChunk.length > 0) {
          chunks.push(lastChunk);
        }
        break;
      }

      // Try to find a natural breaking point near the end:
      // 1. Paragraph boundary (\n\n)
      // 2. Sentence boundary (. , ! , ? followed by space or newline)
      // 3. Newline (\n)
      // 4. Word boundary (space)
      let breakPoint = -1;
      const searchWindow = normalized.substring(
        Math.max(start, end - 120),
        Math.min(normalized.length, end + 40),
      );

      const paragraphBreak = searchWindow.lastIndexOf('\n\n');
      if (paragraphBreak !== -1) {
        breakPoint = Math.max(start, end - 120) + paragraphBreak + 2;
      } else {
        const sentenceMatches = [...searchWindow.matchAll(/[.!?]\s+/g)];
        if (sentenceMatches.length > 0) {
          const lastSentence = sentenceMatches[sentenceMatches.length - 1];
          breakPoint =
            Math.max(start, end - 120) +
            (lastSentence.index ?? 0) +
            lastSentence[0].length;
        } else {
          const spaceBreak = searchWindow.lastIndexOf(' ');
          if (spaceBreak !== -1) {
            breakPoint = Math.max(start, end - 120) + spaceBreak + 1;
          }
        }
      }

      const actualEnd =
        breakPoint > start && breakPoint <= normalized.length
          ? breakPoint
          : end;

      const chunk = normalized.substring(start, actualEnd).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      // Move forward, subtracting overlap
      const nextStart = actualEnd - options.chunkOverlap;
      start = nextStart > start ? nextStart : actualEnd;
    }

    return chunks;
  }
}

