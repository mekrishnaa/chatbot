import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';
import { LoadingIndicatorComponent } from '../loading-indicator/loading-indicator.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule,
    ChatMessageComponent,
    ChatInputComponent,
    LoadingIndicatorComponent,
    ErrorMessageComponent,
  ],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <div class="header-left">
          <span class="status-indicator"></span>
          <span class="header-title">Assistant Q&A</span>
        </div>
        <div class="header-right">
          <button class="clear-btn" (click)="chatService.clearChat()" title="Reset conversation">
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      <app-error-message
        [message]="chatService.error()"
        (dismiss)="chatService.error.set(null)"
      ></app-error-message>

      <div class="messages-scroll-area" #scrollContainer>
        @for (msg of chatService.messages(); track $index) {
          <app-chat-message [message]="msg"></app-chat-message>
        }

        @if (chatService.isStreaming() && isThinking()) {
          <div class="loading-wrapper">
            <app-loading-indicator></app-loading-indicator>
          </div>
        }
      </div>

      <div class="input-container">
        <app-chat-input
          [disabled]="chatService.isStreaming()"
          (send)="handleSend($event)"
        ></app-chat-input>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary);
      overflow: hidden;
      padding: 1.25rem;
    }
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 0.85rem;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-emerald);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }
    .header-title {
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .clear-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      font-size: 0.78rem;
      padding: 0.3rem 0.65rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .clear-btn:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
    .messages-scroll-area {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.5rem;
      display: flex;
      flex-direction: column;
    }
    .loading-wrapper {
      margin-bottom: 1.25rem;
    }
    .input-container {
      margin-top: 0.85rem;
    }
  `],
})
export class ChatWindowComponent implements AfterViewChecked {
  chatService = inject(ChatService);

  @ViewChild('scrollContainer')
  private scrollContainer!: ElementRef;

  private shouldScroll = true;

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
    }
  }

  isThinking(): boolean {
    const msgs = this.chatService.messages();
    if (msgs.length === 0) return false;
    const last = msgs[msgs.length - 1];
    return last.role === 'assistant' && !last.content;
  }

  handleSend(text: string): void {
    this.shouldScroll = true;
    this.chatService.sendMessage(text);
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        const el = this.scrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    } catch {}
  }
}

