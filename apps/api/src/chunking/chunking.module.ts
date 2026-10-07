import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TextChunkerService } from './text-chunker.service';

@Module({
  imports: [ConfigModule],
  providers: [TextChunkerService],
  exports: [TextChunkerService],
})
export class ChunkingModule {}

