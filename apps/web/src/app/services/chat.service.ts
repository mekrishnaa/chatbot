import { Injectable, signal } from '@angular/core';
import { ChatMessageDto, SourceCitation } from '@org-ai/shared';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  readonly messages = signal<ChatMessageDto[]>([]);
  readonly isStreaming = signal<boolean>(false);
  readonly activeConversationId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    // Initial welcome message
    this.messages.set([
      {
        role: 'assistant',
        content:
          'Hello! I am your **Organization AI Assistant**.\n\nYou can upload company documents in the Knowledge Base panel on the left (e.g. employee handbook, leave policy), and ask questions about policies, benefits, or procedures.',
      },
    ]);
  }

  async sendMessage(questionText: string): Promise<void> {
    const text = questionText.trim();
    if (!text || this.isStreaming()) return;

    this.error.set(null);

    // 1. Add user message
    const userMessage: ChatMessageDto = {
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    // 2. Add assistant placeholder message
    const assistantMessage: ChatMessageDto = {
      role: 'assistant',
      content: '',
      sources: [],
      createdAt: new Date().toISOString(),
    };

    this.messages.update((msgs) => [...msgs, userMessage, assistantMessage]);
    this.isStreaming.set(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          conversationId: this.activeConversationId() || undefined,
        }),
      });

      if (!response.ok) {
        let errDetail = 'Failed to connect to chat API';
        try {
          const errBody = await response.json();
          errDetail = errBody.message || errDetail;
        } catch {}
        throw new Error(errDetail);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser/backend');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE blocks separated by \n\n
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || ''; // keep remainder

        for (const part of parts) {
          if (!part.trim()) continue;

          let currentEvent = 'message';
          let dataLines: string[] = [];

          for (const line of part.split('\n')) {
            if (line.startsWith('event: ')) {
              currentEvent = line.substring(7).trim();
            } else if (line.startsWith('data: ')) {
              dataLines.push(line.substring(6));
            }
          }

          const eventData = dataLines.join('\n');

          if (currentEvent === 'sources') {
            try {
              const sources: SourceCitation[] = JSON.parse(eventData);
              this.updateCurrentAssistantMessage((msg) => ({
                ...msg,
                sources,
              }));
            } catch (e) {
              console.error('Failed to parse sources SSE event:', e);
            }
          } else if (currentEvent === 'token') {
            this.updateCurrentAssistantMessage((msg) => ({
              ...msg,
              content: msg.content + eventData,
            }));
          } else if (currentEvent === 'done') {
            try {
              const donePayload = JSON.parse(eventData);
              if (donePayload.conversationId) {
                this.activeConversationId.set(donePayload.conversationId);
              }
            } catch {}
          } else if (currentEvent === 'error') {
            try {
              const errorPayload = JSON.parse(eventData);
              this.error.set(errorPayload.message || 'Chat error occurred');
            } catch {
              this.error.set(eventData);
            }
          }
        }
      }
    } catch (err: any) {
      const msg = err.message || 'Error occurred while contacting AI assistant';
      this.error.set(msg);
      this.updateCurrentAssistantMessage((current) => ({
        ...current,
        content:
          current.content ||
          `⚠️ **Error**: ${msg}\n\n*Please ensure the backend is running and AI provider credentials are configured.*`,
      }));
    } finally {
      this.isStreaming.set(false);
    }
  }

  private updateCurrentAssistantMessage(
    updater: (msg: ChatMessageDto) => ChatMessageDto,
  ): void {
    this.messages.update((list) => {
      if (list.length === 0) return list;
      const copy = [...list];
      const lastIndex = copy.length - 1;
      copy[lastIndex] = updater(copy[lastIndex]);
      return copy;
    });
  }

  clearChat(): void {
    this.messages.set([]);
    this.activeConversationId.set(null);
    this.error.set(null);
  }
}

