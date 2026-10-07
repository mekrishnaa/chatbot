import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';
import { ParserModule } from './parser/parser.module';
import { ChunkingModule } from './chunking/chunking.module';
import { AiModule } from './ai/ai.module';
import { VectorModule } from './vector/vector.module';
import { DocumentsModule } from './documents/documents.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    DatabaseModule,
    StorageModule,
    ParserModule,
    ChunkingModule,
    AiModule,
    VectorModule,
    DocumentsModule,
    ChatModule,
    HealthModule,
  ],
})
export class AppModule {}

