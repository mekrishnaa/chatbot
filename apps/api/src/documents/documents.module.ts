import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DocumentEntity } from '../database/entities/document.entity';
import { DocumentChunkEntity } from '../database/entities/document-chunk.entity';
import { StorageModule } from '../storage/storage.module';
import { ParserModule } from '../parser/parser.module';
import { ChunkingModule } from '../chunking/chunking.module';
import { AiModule } from '../ai/ai.module';
import { VectorModule } from '../vector/vector.module';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([DocumentEntity, DocumentChunkEntity]),
    StorageModule,
    ParserModule,
    ChunkingModule,
    AiModule,
    VectorModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}

