import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentListComponent } from '../document-list/document-list.component';
import { DocumentUploadComponent } from '../document-upload/document-upload.component';
import { ChatWindowComponent } from '../chat-window/chat-window.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { DocumentService } from '../../services/document.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    DocumentListComponent,
    DocumentUploadComponent,
    ChatWindowComponent,
    ErrorMessageComponent,
  ],
  template: `
    <div class="app-layout">
      <!-- Main Application Header -->
      <header class="app-header">
        <div class="header-branding">
          <div class="logo-badge">🏢</div>
          <div class="header-titles">
            <h1 class="app-title">Organization AI Assistant</h1>
            <span class="app-subtitle">RAG with pgvector & external LLM</span>
          </div>
        </div>

        <div class="header-meta">
          <div class="org-pill">
            <span class="org-dot"></span>
            <span class="org-name">Demo Organization</span>
          </div>
        </div>
      </header>

      <!-- Main Content Layout -->
      <div class="app-body">
        <!-- Left Column: Knowledge Base -->
        <aside class="sidebar-kb">
          <div class="kb-header">
            <span class="kb-icon">📚</span>
            <h2 class="kb-title">Knowledge Base</h2>
          </div>

          <app-error-message
            [message]="documentService.error()"
            (dismiss)="documentService.error.set(null)"
          ></app-error-message>

          <div class="kb-content">
            <app-document-list></app-document-list>
          </div>

          <div class="kb-upload-footer">
            <app-document-upload></app-document-upload>
          </div>
        </aside>

        <!-- Right Column: Chat Interface -->
        <main class="main-chat">
          <app-chat-window></app-chat-window>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background-color: var(--bg-primary);
      overflow: hidden;
    }
    .app-header {
      height: 60px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      flex-shrink: 0;
      z-index: 10;
    }
    .header-branding {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .logo-badge {
      font-size: 1.4rem;
      background: var(--bg-tertiary);
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .header-titles {
      display: flex;
      flex-direction: column;
    }
    .app-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.01em;
    }
    .app-subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .header-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .org-pill {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 500;
      color: #34d399;
    }
    .org-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }
    .app-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .sidebar-kb {
      width: 360px;
      background: #131d2e;
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: 1.25rem;
      gap: 1rem;
      flex-shrink: 0;
      overflow: hidden;
    }
    .kb-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    .kb-icon {
      font-size: 1.1rem;
    }
    .kb-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .kb-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .kb-upload-footer {
      flex-shrink: 0;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
    }
    .main-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      height: 100%;
    }

    @media (max-width: 860px) {
      .app-body {
        flex-direction: column;
      }
      .sidebar-kb {
        width: 100%;
        height: 40%;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
      }
      .main-chat {
        height: 60%;
      }
    }
  `],
})
export class AppShellComponent {
  documentService = inject(DocumentService);
}

