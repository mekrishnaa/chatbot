import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="doc-list-wrapper">
      <div class="list-header">
        <span class="title">Documents</span>
        <span class="count-badge">{{ documentService.documents().length }}</span>
        <button
          class="refresh-btn"
          (click)="documentService.loadDocuments()"
          title="Refresh document list"
        >
          🔄
        </button>
      </div>

      <div class="list-container">
        @if (documentService.loading() && documentService.documents().length === 0) {
          <div class="loading-state">Loading knowledge base...</div>
        } @else if (documentService.documents().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📁</span>
            <span class="empty-text">No documents indexed yet.</span>
            <span class="empty-sub">Upload a document below to populate the organization knowledge base.</span>
          </div>
        } @else {
          <div class="docs-scroll">
            @for (doc of documentService.documents(); track doc.id) {
              <div class="doc-card" [class.failed]="doc.status === 'FAILED'">
                <div class="doc-main">
                  <span class="doc-icon">📄</span>
                  <div class="doc-info">
                    <span class="doc-name" [title]="doc.filename">{{ doc.filename }}</span>
                    <div class="doc-meta">
                      <span
                        class="status-pill"
                        [class.ready]="doc.status === 'READY'"
                        [class.processing]="doc.status === 'PROCESSING'"
                        [class.failed]="doc.status === 'FAILED'"
                      >
                        {{ doc.status }}
                      </span>
                      @if (doc.chunkCount !== undefined && doc.chunkCount > 0) {
                        <span class="chunk-count">{{ doc.chunkCount }} chunks</span>
                      }
                    </div>
                    @if (doc.errorMessage) {
                      <div class="doc-error-msg" [title]="doc.errorMessage">
                        {{ doc.errorMessage }}
                      </div>
                    }
                  </div>
                </div>

                <button
                  class="delete-btn"
                  (click)="onDelete(doc.id, doc.filename)"
                  title="Delete document"
                >
                  ✕
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .doc-list-wrapper {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
    .list-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .title {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
    }
    .count-badge {
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      font-size: 0.75rem;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
    }
    .refresh-btn {
      margin-left: auto;
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0.2rem;
      border-radius: 4px;
    }
    .refresh-btn:hover {
      color: var(--text-primary);
    }
    .list-container {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .docs-scroll {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-right: 0.25rem;
    }
    .doc-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.65rem 0.75rem;
      transition: all 0.15s ease;
    }
    .doc-card:hover {
      border-color: var(--border-light);
      background: rgba(15, 23, 42, 0.9);
    }
    .doc-card.failed {
      border-color: rgba(244, 63, 94, 0.4);
    }
    .doc-main {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      overflow: hidden;
      flex: 1;
    }
    .doc-icon {
      font-size: 1.15rem;
      flex-shrink: 0;
    }
    .doc-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      gap: 0.15rem;
    }
    .doc-name {
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .doc-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .status-pill {
      font-size: 0.68rem;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      background: var(--bg-tertiary);
      color: var(--text-muted);
    }
    .status-pill.ready {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .status-pill.processing {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      animation: pulse 1.5s infinite;
    }
    .status-pill.failed {
      background: rgba(244, 63, 94, 0.15);
      color: #f87171;
    }
    .chunk-count {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .doc-error-msg {
      font-size: 0.72rem;
      color: #f87171;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }
    .delete-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.25rem 0.45rem;
      border-radius: 4px;
      font-size: 0.85rem;
      margin-left: 0.5rem;
    }
    .delete-btn:hover {
      background: rgba(244, 63, 94, 0.15);
      color: #f87171;
    }
    .empty-state {
      padding: 1.5rem 1rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      color: var(--text-muted);
      border: 1px dashed var(--border-color);
      border-radius: var(--radius-md);
    }
    .empty-icon {
      font-size: 1.8rem;
      margin-bottom: 0.2rem;
    }
    .empty-text {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .empty-sub {
      font-size: 0.75rem;
      line-height: 1.4;
    }
    .loading-state {
      padding: 1rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      text-align: center;
    }
  `],
})
export class DocumentListComponent {
  documentService = inject(DocumentService);

  async onDelete(id: string, name: string): Promise<void> {
    if (confirm(`Delete document "${name}" and its vector embeddings?`)) {
      await this.documentService.deleteDocument(id);
    }
  }
}

