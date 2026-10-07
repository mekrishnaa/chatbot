export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface DocumentDto {
  id: string;
  organizationId: string;
  filename: string;
  mimeType: string;
  filePath: string;
  status: DocumentStatus;
  chunkCount?: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ChatRole = 'user' | 'assistant' | 'system';

export interface SourceCitation {
  documentId: string;
  filename: string;
  page: number | null;
  chunkId: string;
  score?: number;
  snippet?: string;
}

export interface ChatMessageDto {
  id?: string;
  conversationId?: string;
  role: ChatRole;
  content: string;
  sources?: SourceCitation[];
  createdAt?: string;
}

export interface ChatRequestDto {
  message: string;
  conversationId?: string;
  organizationId?: string;
}

export interface ConversationDto {
  id: string;
  organizationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessageDto[];
}

export interface OrganizationDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatStreamEvent {
  event: 'sources' | 'token' | 'done' | 'error';
  data: string; // JSON string or text token
}

