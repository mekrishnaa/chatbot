export interface ChunkInput {
  documentId: string;
  organizationId: string;
  pages?: { pageNumber: number; text: string }[];
  text: string;
  metadata?: Record<string, any>;
}

export interface DocumentChunk {
  documentId: string;
  organizationId: string;
  content: string;
  chunkIndex: number;
  pageNumber: number | null;
  metadata?: Record<string, any>;
}

export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
}

