import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentEntity } from './document.entity';
import { ConversationEntity } from './conversation.entity';

@Entity('organizations')
export class OrganizationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => DocumentEntity, (doc) => doc.organization)
  documents: DocumentEntity[];

  @OneToMany(() => ConversationEntity, (conv) => conv.organization)
  conversations: ConversationEntity[];
}

