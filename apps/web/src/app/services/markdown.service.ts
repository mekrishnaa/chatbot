import { Injectable } from '@angular/core';
import { marked } from 'marked';
import hljs from 'highlight.js';

@Injectable({
  providedIn: 'root',
})
export class MarkdownService {
  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  }

  render(markdownText: string): string {
    if (!markdownText) return '';
    try {
      return marked.parse(markdownText) as string;
    } catch {
      return markdownText;
    }
  }

  highlightElement(element: HTMLElement): void {
    const blocks = element.querySelectorAll('pre code');
    blocks.forEach((block) => {
      try {
        hljs.highlightElement(block as HTMLElement);
      } catch {
        // ignore
      }
    });
  }
}

