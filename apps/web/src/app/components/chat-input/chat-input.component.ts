import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-input-wrapper">
      <div class="suggestions">
        <button
          type="button"
          class="suggestion-chip"
          (click)="setQuickPrompt('How many paid leaves do employees get?')"
          [disabled]="disabled()"
        >
          💡 Paid leaves?
        </button>
        <button
          type="button"
          class="suggestion-chip"
          (click)="setQuickPrompt('Can employees work remotely?')"
          [disabled]="disabled()"
        >
          💡 Remote work policy?
        </button>
        <button
          type="button"
          class="suggestion-chip"
          (click)="setQuickPrompt('What are the standard working hours?')"
          [disabled]="disabled()"
        >
          💡 Working hours?
        </button>
      </div>

      <div class="input-row">
        <textarea
          #inputArea
          class="chat-textarea"
          [(ngModel)]="inputText"
          placeholder="Ask something about the organization..."
          (keydown.enter)="onEnter($event)"
          [disabled]="disabled()"
          rows="1"
        ></textarea>

        <button
          class="send-btn"
          (click)="submit()"
          [disabled]="disabled() || !inputText.trim()"
          title="Send message"
        >
          @if (disabled()) {
            <span class="spinner"></span>
          } @else {
            <span>Send</span>
            <span class="send-icon">➤</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 0.75rem 1rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .suggestion-chip {
      background: rgba(51, 65, 85, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #94a3b8;
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .suggestion-chip:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.4);
      color: #93c5fd;
    }
    .input-row {
      display: flex;
      align-items: flex-end;
      gap: 0.75rem;
    }
    .chat-textarea {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-family: var(--font-sans);
      font-size: 0.95rem;
      line-height: 1.4;
      resize: none;
      outline: none;
      max-height: 140px;
      min-height: 24px;
    }
    .chat-textarea::placeholder {
      color: var(--text-muted);
    }
    .send-btn {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--accent-blue);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      padding: 0.55rem 1rem;
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .send-btn:hover:not(:disabled) {
      background: var(--accent-blue-hover);
    }
    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .send-icon {
      font-size: 0.8rem;
    }
    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class ChatInputComponent {
  disabled = input<boolean>(false);
  send = output<string>();

  inputText = '';

  onEnter(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.submit();
    }
  }

  submit(): void {
    const trimmed = this.inputText.trim();
    if (!trimmed || this.disabled()) return;
    this.send.emit(trimmed);
    this.inputText = '';
  }

  setQuickPrompt(promptText: string): void {
    this.inputText = promptText;
    this.submit();
  }
}

