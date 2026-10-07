import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DocumentEntity } from '../database/entities/document.entity';
import { DocumentChunkEntity } from '../database/entities/document-chunk.entity';
import { STORAGE_SERVICE, StorageService } from '../storage/storage.interface';
import {
  DOCUMENT_PARSER_REGISTRY,
  DocumentParser,
} from '../parser/parser.interface';
import { TextChunkerService } from '../chunking/text-chunker.service';
import {
  EMBEDDING_SERVICE,
  EmbeddingService,
} from '../ai/embeddings/embedding.interface';
import { VectorService } from '../vector/vector.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly defaultOrgId: string;

  constructor(
    @InjectRepository(DocumentEntity)
    private readonly docRepo: Repository<DocumentEntity>,
    @InjectRepository(DocumentChunkEntity)
    private readonly chunkRepo: Repository<DocumentChunkEntity>,
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
    @Inject(DOCUMENT_PARSER_REGISTRY)
    private readonly parsers: DocumentParser[],
    private readonly chunkerService: TextChunkerService,
    @Inject(EMBEDDING_SERVICE)
    private readonly embeddingService: EmbeddingService,
    private readonly vectorService: VectorService,
    private readonly configService: ConfigService,
  ) {
    this.defaultOrgId = this.configService.get<string>(
      'DEMO_ORGANIZATION_ID',
      '00000000-0000-0000-0000-000000000001',
    );
  }

  async getAllDocuments(orgId = this.defaultOrgId) {
    const docs = await this.docRepo.find({
      where: { organizationId: orgId },
      order: { createdAt: 'DESC' },
      relations: ['chunks'],
    });

    return docs.map((doc) => ({
      id: doc.id,
      organizationId: doc.organizationId,
      filename: doc.filename,
      mimeType: doc.mimeType,
      filePath: doc.filePath,
      status: doc.status,
      chunkCount: doc.chunks ? doc.chunks.length : 0,
      errorMessage: doc.errorMessage,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }));
  }

  async getDocumentById(id: string, orgId = this.defaultOrgId) {
    const doc = await this.docRepo.findOne({
      where: { id, organizationId: orgId },
      relations: ['chunks'],
    });
    if (!doc) {
      throw new NotFoundException(`Document with ID "${id}" not found.`);
    }
    return doc;
  }

  async uploadAndProcess(
    file: Express.Multer.File,
    orgId = this.defaultOrgId,
  ) {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Empty or missing file upload.');
    }

    const filename = file.originalname || 'document.txt';
    const mimeType = file.mimetype || 'text/plain';

    // 1. Check parser support
    const parser = this.parsers.find((p) => p.supports(mimeType, filename));
    if (!parser) {
      throw new BadRequestException(
        `Unsupported file type "${mimeType}" for file "${filename}". Supported formats: TXT, PDF, DOCX.`,
      );
    }

    // 2. Save original file to storage
    const storedPath = await this.storageService.saveFile(
      filename,
      file.buffer,
      mimeType,
    );

    // 3. Create document record in database
    const document = this.docRepo.create({
      organizationId: orgId,
      filename,
      mimeType,
      filePath: storedPath,
      status: 'PROCESSING',
    });
    await this.docRepo.save(document);

    // 4. Run document processing pipeline
    try {
      this.logger.log(`Processing document ${document.id}: Extracting text...`);
      const extracted = await parser.extractText(storedPath, file.buffer);

      if (!extracted.text || extracted.text.trim().length === 0) {
        throw new Error('Extracted text is empty or could not be read.');
      }

      this.logger.log(`Chunking document ${document.id}...`);
      const chunks = this.chunkerService.chunk({
        documentId: document.id,
        organizationId: orgId,
        text: extracted.text,
        pages: extracted.pages,
        metadata: {
          filename,
        },
      });

      if (chunks.length === 0) {
        throw new Error('Document produced 0 chunks after processing.');
      }

      this.logger.log(
        `Generating embeddings for ${chunks.length} chunks of document ${document.id}...`,
      );
      const chunkTexts = chunks.map((c) => c.content);
      const embeddings = await this.embeddingService.generateEmbeddings(chunkTexts);

      this.logger.log(`Storing vector embeddings in database...`);
      const chunksToInsert = chunks.map((c, i) => ({
        documentId: document.id,
        organizationId: orgId,
        content: c.content,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        metadata: c.metadata,
        embedding: embeddings[i],
      }));

      await this.vectorService.insertChunks(chunksToInsert);

      document.status = 'READY';
      document.errorMessage = null;
      await this.docRepo.save(document);

      this.logger.log(`Document ${document.id} successfully processed and READY.`);

      return {
        id: document.id,
        organizationId: document.organizationId,
        filename: document.filename,
        mimeType: document.mimeType,
        filePath: document.filePath,
        status: document.status,
        chunkCount: chunks.length,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString(),
      };
    } catch (err: any) {
      this.logger.error(
        `Document processing failed for ${document.id}: ${err.message}`,
        err.stack,
      );
      document.status = 'FAILED';
      document.errorMessage = err.message || 'Processing failed';
      await this.docRepo.save(document);

      throw new BadRequestException(
        `Document processing failed: ${err.message}`,
      );
    }
  }

  async deleteDocument(id: string, orgId = this.defaultOrgId) {
    const doc = await this.getDocumentById(id, orgId);

    // Delete chunks and vector embeddings
    await this.vectorService.deleteChunksForDocument(doc.id);

    // Delete stored file
    await this.storageService.deleteFile(doc.filePath);

    // Delete document entity
    await this.docRepo.delete({ id: doc.id, organizationId: orgId });

    this.logger.log(`Deleted document ${id} and all related chunks.`);
    return { success: true, message: `Document "${doc.filename}" removed.` };
  }
}

