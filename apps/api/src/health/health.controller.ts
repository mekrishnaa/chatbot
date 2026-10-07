import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Controller('api')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  @Get('health')
  async checkHealth() {
    let dbStatus = 'disconnected';
    let pgvectorStatus = 'unknown';

    try {
      if (this.dataSource.isInitialized) {
        dbStatus = 'connected';
        const res = await this.dataSource.query(
          `SELECT extname FROM pg_extension WHERE extname = 'vector';`,
        );
        pgvectorStatus = res.length > 0 ? 'installed and ready' : 'not installed';
      }
    } catch (err: any) {
      dbStatus = `error: ${err.message}`;
    }

    const aiProvider = this.configService.get<string>('AI_PROVIDER', 'openai');
    const aiModel = this.configService.get<string>('AI_MODEL', 'gpt-4o-mini');
    const embeddingProvider = this.configService.get<string>(
      'EMBEDDING_PROVIDER',
      'openai',
    );
    const embeddingModel = this.configService.get<string>(
      'EMBEDDING_MODEL',
      'text-embedding-3-small',
    );

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        pgvector: pgvectorStatus,
      },
      ai: {
        provider: aiProvider,
        model: aiModel,
        embeddingProvider,
        embeddingModel,
      },
    };
  }
}

