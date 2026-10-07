import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-container">
      <div class="typing-bubble">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
      @if (label()) {
        <span class="label">{{ label() }}</span>
      }
    </div>
  `,
  styles: [`
    .loader-container {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.5rem 0.75rem;
      background: var(--bg-tertiary);
      border-radius: var(--radius-md);
    }
    .typing-bubble {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .dot {
      width: 7px;
      height: 7px;
      background: #38bdf8;
      border-radius: 50%;
      animation: pulse 1.4s infinite ease-in-out both;
    }
    .dot:nth-child(1) {
      animation-delay: -0.32s;
    }
    .dot:nth-child(2) {
      animation-delay: -0.16s;
    }
    @keyframes pulse {
      0%, 80%, 100% {
        transform: scale(0.6);
        opacity: 0.4;
      }
      40% {
        transform: scale(1.1);
        opacity: 1;
      }
    }
    .label {
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
  `],
})
export class LoadingIndicatorComponent {
  label = input<string>('Searching knowledge base & thinking...');
}

