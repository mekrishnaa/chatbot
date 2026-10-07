import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  organizationId: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  filename: string;
  distance: number;
  score: number; // 1 - distance
}

export interface InsertChunkInput {
  documentId: string;
  organizationId: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  metadata?: Record<string, any> | null;
  embedding: number[];
}

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Inserts document chunks with their vector embeddings into PostgreSQL.
   */
  async insertChunks(chunks: InsertChunkInput[]): Promise<void> {
    if (chunks.length === 0) return;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const chunk of chunks) {
        const vectorStr = `[${chunk.embedding.join(',')}]`;
        const metadataJson = chunk.metadata ? JSON.stringify(chunk.metadata) : null;

        await queryRunner.query(
          `
          INSERT INTO document_chunks (
            id,
            document_id,
            organization_id,
            content,
            chunk_index,
            page_number,
            metadata,
            embedding,
            created_at
          ) VALUES (
            gen_random_uuid(),
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7::vector,
            NOW()
          )
        `,
          [
            chunk.documentId,
            chunk.organizationId,
            chunk.content,
            chunk.chunkIndex,
            chunk.pageNumber,
            metadataJson,
            vectorStr,
          ],
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully stored ${chunks.length} chunks with vector embeddings`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to insert document chunks: ${err.message}`, err.stack);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Performs vector similarity search with organization filtering.
   * Uses cosine distance (<=> operator in pgvector).
   */
  async similaritySearch(
    organizationId: string,
    queryEmbedding: number[],
    topK = 5,
  ): Promise<RetrievedChunk[]> {
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    try {
      const rows = await this.dataSource.query(
        `
        SELECT
          dc.id as "chunkId",
          dc.document_id as "documentId",
          dc.organization_id as "organizationId",
          dc.content as "content",
          dc.chunk_index as "chunkIndex",
          dc.page_number as "pageNumber",
          d.filename as "filename",
          (dc.embedding <=> $1::vector) as "distance"
        FROM document_chunks dc
        INNER JOIN documents d ON dc.document_id = d.id
        WHERE dc.organization_id = $2
          AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> $1::vector ASC
        LIMIT $3
      `,
        [vectorStr, organizationId, topK],
      );

      return rows.map((r: any) => ({
        chunkId: r.chunkId,
        documentId: r.documentId,
        organizationId: r.organizationId,
        content: r.content,
        chunkIndex: Number(r.chunkIndex),
        pageNumber: r.pageNumber !== null ? Number(r.pageNumber) : null,
        filename: r.filename,
        distance: Number(r.distance),
        score: Math.max(0, 1 - Number(r.distance)),
      }));
    } catch (err: any) {
      this.logger.error(`Vector similarity search failed: ${err.message}`, err.stack);
      throw new Error(`Vector retrieval error: ${err.message}`);
    }
  }

  /**
   * Deletes all chunks associated with a document.
   */
  async deleteChunksForDocument(documentId: string): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM document_chunks WHERE document_id = $1`,
      [documentId],
    );
  }
}

