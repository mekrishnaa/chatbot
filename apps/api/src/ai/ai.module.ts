import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LLM_SERVICE } from './llm/llm.interface';
import { OpenAiLlmService } from './llm/openai-llm.service';
import { MockLlmService } from './llm/mock-llm.service';
import { EMBEDDING_SERVICE } from './embeddings/embedding.interface';
import { OpenAiEmbeddingService } from './embeddings/openai-embedding.service';
import { MockEmbeddingService } from './embeddings/mock-embedding.service';

@Module({
  imports: [ConfigModule],
  providers: [
    OpenAiLlmService,
    MockLlmService,
    OpenAiEmbeddingService,
    MockEmbeddingService,
    {
      provide: LLM_SERVICE,
      useFactory: (
        config: ConfigService,
        openAiLlm: OpenAiLlmService,
        mockLlm: MockLlmService,
      ) => {
        const provider = (config.get<string>('AI_PROVIDER') || 'openai').toLowerCase();
        if (provider === 'mock') {
          return mockLlm;
        }
        return openAiLlm;
      },
      inject: [ConfigService, OpenAiLlmService, MockLlmService],
    },
    {
      provide: EMBEDDING_SERVICE,
      useFactory: (
        config: ConfigService,
        openAiEmb: OpenAiEmbeddingService,
        mockEmb: MockEmbeddingService,
      ) => {
        const provider = (
          config.get<string>('EMBEDDING_PROVIDER') ||
          config.get<string>('AI_PROVIDER') ||
          'openai'
        ).toLowerCase();
        if (provider === 'mock') {
          return mockEmb;
        }
        return openAiEmb;
      },
      inject: [ConfigService, OpenAiEmbeddingService, MockEmbeddingService],
    },
  ],
  exports: [LLM_SERVICE, EMBEDDING_SERVICE],
})
export class AiModule {}

