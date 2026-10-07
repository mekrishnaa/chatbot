import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message()) {
      <div class="error-banner">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{{ message() }}</span>
        </div>
        <button class="close-btn" (click)="dismiss.emit()" title="Dismiss">✕</button>
      </div>
    }
  `,
  styles: [`
    .error-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.4);
      color: #fda4af;
      padding: 0.65rem 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
      font-size: 0.88rem;
    }
    .error-content {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .error-icon {
      font-size: 1.1rem;
    }
    .close-btn {
      background: none;
      border: none;
      color: #fda4af;
      font-size: 0.9rem;
      cursor: pointer;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
    .close-btn:hover {
      background: rgba(244, 63, 94, 0.25);
    }
  `],
})
export class ErrorMessageComponent {
  message = input<string | null>(null);
  dismiss = output<void>();
}

