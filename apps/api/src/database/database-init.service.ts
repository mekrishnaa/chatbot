import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseInitService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    try {
      this.logger.log('Initializing database schema and pgvector extension...');

      // 1. Ensure extensions exist
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector;');

      const dimension = parseInt(
        this.configService.get<string>('EMBEDDING_DIMENSION', '1536'),
        10,
      );

      // 2. Ensure embedding column is explicitly vector(dim)
      await this.dataSource.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'document_chunks' AND column_name = 'embedding'
          ) THEN
            ALTER TABLE document_chunks ADD COLUMN embedding vector(${dimension});
          ELSE
            -- Alter column type to vector if not already
            BEGIN
              ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(${dimension}) USING embedding::vector;
            EXCEPTION WHEN OTHERS THEN
              NULL;
            END;
          END IF;
        END $$;
      `);

      // 3. Optional HNSW vector index
      try {
        await this.dataSource.query(`
          CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
          ON document_chunks
          USING hnsw (embedding vector_cosine_ops);
        `);
      } catch (idxErr) {
        this.logger.warn(`Could not create HNSW index (pgvector version may not support HNSW or insufficient data): ${idxErr.message}`);
      }

      // 4. Seed Demo Organization
      const demoOrgId = this.configService.get<string>(
        'DEMO_ORGANIZATION_ID',
        '00000000-0000-0000-0000-000000000001',
      );
      const demoOrgName = this.configService.get<string>(
        'DEMO_ORGANIZATION_NAME',
        'Demo Organization',
      );

      await this.dataSource.query(
        `
        INSERT INTO organizations (id, name, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
      `,
        [demoOrgId, demoOrgName],
      );

      this.logger.log(
        `Database initialized successfully. Demo organization ready: ${demoOrgName} (${demoOrgId})`,
      );
    } catch (err: any) {
      this.logger.error(
        `Database initialization notice: ${err.message}. If PostgreSQL is not yet running, start it using: docker compose up -d`,
      );
    }
  }
}

