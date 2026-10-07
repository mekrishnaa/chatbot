import { Component, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SourceCitation } from '@org-ai/shared';

@Component({
  selector: 'app-source-citation',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (sources() && sources()!.length > 0) {
      <div class="citations-container">
        <div class="citations-header">
          <span class="citations-title">Sources</span>
          <span class="citations-badge">{{ sources()!.length }} referenced</span>
        </div>
        <div class="citations-list">
          @for (source of sources()!; track source.chunkId || $index) {
            <div class="citation-card" (click)="toggleExpanded(source.chunkId)">
              <div class="citation-item">
                <span class="doc-icon">📄</span>
                <span class="doc-name">{{ source.filename }}</span>
                @if (source.page !== null && source.page !== undefined) {
                  <span class="doc-page">— Page {{ source.page }}</span>
                }
                @if (source.score !== undefined) {
                  <span class="doc-score" title="Relevance score">
                    {{ (source.score * 100).toFixed(0) }}% match
                  </span>
                }
              </div>

              @if (isExpanded(source.chunkId) && source.snippet) {
                <div class="citation-snippet">
                  <div class="snippet-label">Retrieved chunk content:</div>
                  <div class="snippet-text">{{ source.snippet }}</div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .citations-container {
      margin-top: 0.85rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .citations-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .citations-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
      color: var(--text-secondary);
    }
    .citations-badge {
      font-size: 0.7rem;
      padding: 0.1rem 0.4rem;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-radius: 4px;
    }
    .citations-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .citation-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-sm);
      padding: 0.4rem 0.65rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .citation-card:hover {
      background: rgba(15, 23, 42, 0.9);
      border-color: rgba(59, 130, 246, 0.3);
    }
    .citation-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.82rem;
    }
    .doc-icon {
      font-size: 0.85rem;
    }
    .doc-name {
      font-weight: 500;
      color: #93c5fd;
    }
    .doc-page {
      color: var(--text-muted);
      font-size: 0.78rem;
    }
    .doc-score {
      margin-left: auto;
      font-size: 0.72rem;
      color: #34d399;
      background: rgba(16, 185, 129, 0.1);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }
    .citation-snippet {
      margin-top: 0.4rem;
      padding-top: 0.4rem;
      border-top: 1px dashed rgba(255, 255, 255, 0.08);
      font-size: 0.76rem;
      color: var(--text-secondary);
    }
    .snippet-label {
      font-size: 0.68rem;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.2rem;
    }
    .snippet-text {
      font-family: var(--font-mono);
      white-space: pre-wrap;
      line-height: 1.4;
      background: rgba(0, 0, 0, 0.2);
      padding: 0.4rem;
      border-radius: 4px;
    }
  `],
})
export class SourceCitationComponent {
  sources = input<SourceCitation[] | undefined>([]);
  private expandedMap = signal<Record<string, boolean>>({});

  toggleExpanded(chunkId: string) {
    this.expandedMap.update((map) => ({
      ...map,
      [chunkId]: !map[chunkId],
    }));
  }

  isExpanded(chunkId: string): boolean {
    return !!this.expandedMap()[chunkId];
  }
}

