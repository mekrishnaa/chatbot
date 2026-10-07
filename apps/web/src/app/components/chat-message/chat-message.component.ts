import {
  Component,
  input,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessageDto } from '@org-ai/shared';
import { MarkdownService } from '../../services/markdown.service';
import { SourceCitationComponent } from '../source-citation/source-citation.component';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule, SourceCitationComponent],
  template: `
    <div
      class="message-wrapper"
      [class.user]="message().role === 'user'"
      [class.assistant]="message().role === 'assistant'"
    >
      <div class="avatar">
        @if (message().role === 'user') {
          <span>👤</span>
        } @else {
          <span>🤖</span>
        }
      </div>

      <div class="message-bubble">
        <div class="message-header">
          <span class="role-name">
            {{ message().role === 'user' ? 'You' : 'AI Assistant' }}
          </span>
        </div>

        @if (message().role === 'user') {
          <div class="user-content">{{ message().content }}</div>
        } @else {
          @if (!message().content && (!message().sources || message().sources!.length === 0)) {
            <div class="thinking-placeholder">Generating answer from organizational context...</div>
          } @else {
            <div
              class="markdown-body"
              [innerHTML]="renderedContent"
            ></div>
          }

          <app-source-citation [sources]="message().sources"></app-source-citation>
        }
      </div>
    </div>
  `,
  styles: [`
    .message-wrapper {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      width: 100%;
    }
    .message-wrapper.user {
      flex-direction: row-reverse;
    }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
      border: 1px solid var(--border-color);
    }
    .message-wrapper.user .avatar {
      background: #1d4ed8;
      border-color: #2563eb;
    }
    .message-bubble {
      max-width: 82%;
      padding: 0.85rem 1.1rem;
      border-radius: var(--radius-lg);
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .message-wrapper.user .message-bubble {
      background: var(--bg-bubble-user);
      color: #ffffff;
      border-top-right-radius: 4px;
    }
    .message-wrapper.assistant .message-bubble {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-top-left-radius: 4px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .message-header {
      margin-bottom: 0.35rem;
    }
    .role-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      letter-spacing: 0.03em;
    }
    .message-wrapper.user .role-name {
      color: rgba(255, 255, 255, 0.7);
    }
    .user-content {
      white-space: pre-wrap;
      word-break: break-word;
    }
    .thinking-placeholder {
      font-style: italic;
      color: var(--text-muted);
      font-size: 0.9rem;
    }
  `],
})
export class ChatMessageComponent implements AfterViewInit, AfterViewChecked {
  message = input.required<ChatMessageDto>();
  private markdownService = inject(MarkdownService);
  private elementRef = inject(ElementRef);

  get renderedContent(): string {
    return this.markdownService.render(this.message().content);
  }

  ngAfterViewInit(): void {
    this.highlightCode();
  }

  ngAfterViewChecked(): void {
    this.highlightCode();
  }

  private highlightCode(): void {
    if (this.message().role === 'assistant') {
      this.markdownService.highlightElement(this.elementRef.nativeElement);
    }
  }
}

