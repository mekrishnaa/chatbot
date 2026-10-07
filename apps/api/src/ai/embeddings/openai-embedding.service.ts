import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbeddingService } from './embedding.interface';

@Injectable()
export class OpenAiEmbeddingService implements EmbeddingService {
  private readonly logger = new Logger(OpenAiEmbeddingService.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly dimension: number;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('EMBEDDING_API_KEY') ||
      this.configService.get<string>('AI_API_KEY') ||
      'dummy-api-key';
    const baseURL =
      this.configService.get<string>('EMBEDDING_BASE_URL') ||
      this.configService.get<string>('AI_BASE_URL');
    this.model =
      this.configService.get<string>(
        'EMBEDDING_MODEL',
        'text-embedding-3-small',
      );
    this.dimension = parseInt(
      this.configService.get<string>('EMBEDDING_DIMENSION', '1536'),
      10,
    );

    this.client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });

    this.logger.log(
      `Initialized OpenAI Embedding Service (model: ${this.model}, dimension: ${this.dimension}${baseURL ? `, baseURL: ${baseURL}` : ''})`,
    );
  }

  getDimension(): number {
    return this.dimension;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const sanitizedText = text.replace(/\n+/g, ' ').trim();
    if (!sanitizedText) {
      return new Array(this.dimension).fill(0);
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: sanitizedText,
      });

      return response.data[0].embedding;
    } catch (err: any) {
      this.logger.error(`Embedding generation failed: ${err.message}`, err.stack);
      if (err.status === 401) {
        throw new Error('Embedding Provider Authentication Failed: Invalid API key.');
      }
      throw new Error(`Embedding generation error: ${err.message || 'Unknown error'}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const sanitizedTexts = texts.map((t) => t.replace(/\n+/g, ' ').trim() || ' ');

    try {
      // Chunk batch in groups of 50 to avoid request size limits
      const batchSize = 50;
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < sanitizedTexts.length; i += batchSize) {
        const batch = sanitizedTexts.slice(i, i + batchSize);
        const response = await this.client.embeddings.create({
          model: this.model,
          input: batch,
        });

        // Ensure embeddings are ordered correctly
        const sorted = response.data.sort((a, b) => a.index - b.index);
        for (const item of sorted) {
          allEmbeddings.push(item.embedding);
        }
      }

      return allEmbeddings;
    } catch (err: any) {
      this.logger.error(`Batch embedding generation failed: ${err.message}`, err.stack);
      if (err.status === 401) {
        throw new Error('Embedding Provider Authentication Failed: Invalid API key.');
      }
      throw new Error(`Batch embedding generation error: ${err.message || 'Unknown error'}`);
    }
  }
}

