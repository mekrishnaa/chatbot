import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { ConversationEntity } from '../database/entities/conversation.entity';
import { MessageEntity } from '../database/entities/message.entity';
import {
  EMBEDDING_SERVICE,
  EmbeddingService,
} from '../ai/embeddings/embedding.interface';
import { LLM_SERVICE, LlmService } from '../ai/llm/llm.interface';
import { VectorService, RetrievedChunk } from '../vector/vector.service';
import { RagPromptTemplate } from '../ai/prompt/rag-prompt.template';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  organizationId?: string;
}

export interface SourceCitationDto {
  documentId: string;
  filename: string;
  page: number | null;
  chunkId: string;
  score: number;
  snippet?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly defaultOrgId: string;
  private readonly topK: number;

  constructor(
    @InjectRepository(ConversationEntity)
    private readonly convRepo: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private readonly msgRepo: Repository<MessageEntity>,
    @Inject(EMBEDDING_SERVICE)
    private readonly embeddingService: EmbeddingService,
    @Inject(LLM_SERVICE)
    private readonly llmService: LlmService,
    private readonly vectorService: VectorService,
    private readonly configService: ConfigService,
  ) {
    this.defaultOrgId = this.configService.get<string>(
      'DEMO_ORGANIZATION_ID',
      '00000000-0000-0000-0000-000000000001',
    );
    this.topK = parseInt(this.configService.get<string>('TOP_K', '5'), 10);
  }

  async getConversations(orgId = this.defaultOrgId) {
    return this.convRepo.find({
      where: { organizationId: orgId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getConversationById(id: string, orgId = this.defaultOrgId) {
    const conv = await this.convRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['messages'],
      order: {
        messages: {
          createdAt: 'ASC',
        },
      },
    });
    if (!conv) {
      throw new NotFoundException(`Conversation ${id} not found.`);
    }
    return conv;
  }

  async deleteConversation(id: string, orgId = this.defaultOrgId) {
    const conv = await this.convRepo.findOne({
      where: { id, organizationId: orgId },
    });
    if (!conv) {
      throw new NotFoundException(`Conversation ${id} not found.`);
    }
    await this.convRepo.remove(conv);
    return { success: true };
  }

  /**
   * Main RAG Flow:
   * 1. Get/create conversation
   * 2. Save user message
   * 3. Embed question
   * 4. Retrieve top K chunks using pgvector with organization filter
   * 5. Build prompt
   * 6. Stream SSE response to client
   * 7. Save assistant message and citations
   */
  async handleChatStream(
    dto: ChatRequest,
    res: Response,
    orgId = this.defaultOrgId,
  ): Promise<void> {
    const userQuestion = dto.message.trim();

    // 1. Get or create conversation
    let conversation: ConversationEntity;
    if (dto.conversationId) {
      conversation = await this.convRepo.findOne({
        where: { id: dto.conversationId, organizationId: orgId },
      });
      if (!conversation) {
        conversation = this.convRepo.create({
          id: dto.conversationId,
          organizationId: orgId,
          title: userQuestion.slice(0, 50),
        });
        await this.convRepo.save(conversation);
      }
    } else {
      conversation = this.convRepo.create({
        organizationId: orgId,
        title: userQuestion.slice(0, 50),
      });
      await this.convRepo.save(conversation);
    }

    // 2. Save user message
    const userMsg = this.msgRepo.create({
      conversationId: conversation.id,
      role: 'user',
      content: userQuestion,
    });
    await this.msgRepo.save(userMsg);

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const sendEvent = (event: string, data: any) => {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      res.write(`event: ${event}\ndata: ${payload}\n\n`);
    };

    try {
      this.logger.log(`Processing RAG question for Org [${orgId}]: "${userQuestion}"`);

      // 3. Generate question embedding
      const questionEmbedding = await this.embeddingService.generateEmbedding(
        userQuestion,
      );

      // 4. Vector similarity search in pgvector (filtered by orgId)
      const retrievedChunks: RetrievedChunk[] =
        await this.vectorService.similaritySearch(
          orgId,
          questionEmbedding,
          this.topK,
        );

      this.logger.log(`Retrieved ${retrievedChunks.length} relevant chunks from pgvector`);

      // 5. Build Source Citations
      const sources: SourceCitationDto[] = retrievedChunks.map((chunk) => ({
        documentId: chunk.documentId,
        filename: chunk.filename,
        page: chunk.pageNumber,
        chunkId: chunk.chunkId,
        score: Math.round(chunk.score * 100) / 100,
        snippet: chunk.content.slice(0, 180) + '...',
      }));

      // Immediately send sources to client
      sendEvent('sources', sources);

      // 6. Build RAG prompt
      const contextChunks = retrievedChunks.map((c) => ({
        filename: c.filename,
        pageNumber: c.pageNumber,
        chunkIndex: c.chunkIndex,
        content: c.content,
      }));

      const { systemPrompt, userPrompt } = RagPromptTemplate.buildPrompt(
        userQuestion,
        contextChunks,
      );

      // 7. Stream LLM tokens
      let fullAssistantAnswer = '';

      const stream = this.llmService.streamChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      for await (const token of stream) {
        fullAssistantAnswer += token;
        sendEvent('token', token);
      }

      // 8. Save assistant response to database
      const assistantMsg = this.msgRepo.create({
        conversationId: conversation.id,
        role: 'assistant',
        content: fullAssistantAnswer,
        sources,
      });
      await this.msgRepo.save(assistantMsg);

      // Update conversation updatedAt
      conversation.updatedAt = new Date();
      await this.convRepo.save(conversation);

      // 9. Notify completion
      sendEvent('done', {
        conversationId: conversation.id,
        messageId: assistantMsg.id,
        fullAnswer: fullAssistantAnswer,
      });

      res.end();
    } catch (err: any) {
      this.logger.error(`Error during chat streaming: ${err.message}`, err.stack);
      sendEvent('error', {
        message: err.message || 'An unexpected error occurred during chat response generation.',
      });
      res.end();
    }
  }
}

