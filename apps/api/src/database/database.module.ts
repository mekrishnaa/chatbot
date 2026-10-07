import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrganizationEntity } from './entities/organization.entity';
import { DocumentEntity } from './entities/document.entity';
import { DocumentChunkEntity } from './entities/document-chunk.entity';
import { ConversationEntity } from './entities/conversation.entity';
import { MessageEntity } from './entities/message.entity';
import { DatabaseInitService } from './database-init.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>(
          'DATABASE_URL',
          'postgresql://postgres:postgres@localhost:5432/org_ai',
        );

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: [
            OrganizationEntity,
            DocumentEntity,
            DocumentChunkEntity,
            ConversationEntity,
            MessageEntity,
          ],
          synchronize: true, // Auto-create tables for MVP/dev
          logging: false,
          ssl: false,
        };
      },
    }),
    TypeOrmModule.forFeature([
      OrganizationEntity,
      DocumentEntity,
      DocumentChunkEntity,
      ConversationEntity,
      MessageEntity,
    ]),
  ],
  providers: [DatabaseInitService],
  exports: [TypeOrmModule, DatabaseInitService],
})
export class DatabaseModule {}

