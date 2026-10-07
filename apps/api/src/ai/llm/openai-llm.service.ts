import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { LlmChatMessage, LlmOptions, LlmService } from './llm.interface';

@Injectable()
export class OpenAiLlmService implements LlmService {
  private readonly logger = new Logger(OpenAiLlmService.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('AI_API_KEY') || 'dummy-api-key';
    const baseURL = this.configService.get<string>('AI_BASE_URL');
    this.defaultModel =
      this.configService.get<string>('AI_MODEL') || 'gpt-4o-mini';

    this.client = new OpenAI({
      apiKey,
      ...(baseURL ? { baseURL } : {}),
    });

    this.logger.log(
      `Initialized OpenAI LLM Service (model: ${this.defaultModel}${baseURL ? `, baseURL: ${baseURL}` : ''})`,
    );
  }

  async *streamChat(
    messages: LlmChatMessage[],
    options?: LlmOptions,
  ): AsyncIterable<string> {
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature ?? 0.1;
    const maxTokens = options?.maxTokens ?? 1000;

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          yield delta;
        }
      }
    } catch (err: any) {
      this.logger.error(`LLM streaming error: ${err.message}`, err.stack);
      if (err.status === 401) {
        throw new Error('AI Provider Authentication Failed: Invalid API key.');
      }
      if (err.status === 429) {
        throw new Error('AI Provider Rate Limit Exceeded. Please try again shortly.');
      }
      throw new Error(`AI LLM error: ${err.message || 'Unknown provider error'}`);
    }
  }

  async completeChat(
    messages: LlmChatMessage[],
    options?: LlmOptions,
  ): Promise<string> {
    let fullText = '';
    for await (const token of this.streamChat(messages, options)) {
      fullText += token;
    }
    return fullText;
  }
}

