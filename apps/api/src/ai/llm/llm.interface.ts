export interface LlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LlmService {
  streamChat(
    messages: LlmChatMessage[],
    options?: LlmOptions,
  ): AsyncIterable<string>;

  completeChat(
    messages: LlmChatMessage[],
    options?: LlmOptions,
  ): Promise<string>;
}

export const LLM_SERVICE = 'LLM_SERVICE';

