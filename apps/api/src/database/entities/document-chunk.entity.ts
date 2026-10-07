import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DocumentEntity } from './document.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('document_chunks')
export class DocumentChunkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'document_id', type: 'uuid' })
  documentId: string;

  @Index()
  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number;

  @Column({ name: 'page_number', type: 'int', nullable: true })
  pageNumber: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  // Embedding column is handled as pgvector in PostgreSQL
  @Column({
    type: 'text',
    nullable: true,
    transformer: {
      to: (value: number[] | null): string | null => {
        if (!value) return null;
        return `[${value.join(',')}]`;
      },
      from: (value: string | number[] | null): number[] | null => {
        if (!value) return null;
        if (Array.isArray(value)) return value;
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      },
    },
  })
  embedding: number[] | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => DocumentEntity, (doc) => doc.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document: DocumentEntity;

  @ManyToOne(() => OrganizationEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: OrganizationEntity;
}

