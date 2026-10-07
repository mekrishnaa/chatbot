import { Injectable, Logger } from '@nestjs/common';
import { LlmChatMessage, LlmOptions, LlmService } from './llm.interface';

@Injectable()
export class MockLlmService implements LlmService {
  private readonly logger = new Logger(MockLlmService.name);

  async *streamChat(
    messages: LlmChatMessage[],
    _options?: LlmOptions,
  ): AsyncIterable<string> {
    this.logger.log('Mock LLM streaming requested');
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';

    let answer = "I couldn't find that information in the organization's available documents.";

    // Check if the system message context contains answers to standard questions
    const lowerSystem = systemMessage.toLowerCase();
    const lowerUser = lastUserMessage.toLowerCase();

    if (lowerUser.includes('paid leave') || lowerUser.includes('leaves') || lowerUser.includes('vacation')) {
      if (lowerSystem.includes('24 paid leave days')) {
        answer = 'Employees are entitled to 24 paid leave days per calendar year. Leave requests must be submitted through the employee portal and approved by the manager.';
      }
    } else if (lowerUser.includes('remote work') || lowerUser.includes('work remotely')) {
      if (lowerSystem.includes('remotely up to 3 days')) {
        answer = 'Employees may work remotely up to 3 days per week with manager approval.';
      }
    } else if (lowerUser.includes('working hour') || lowerUser.includes('hours')) {
      if (lowerSystem.includes('9:00 am to 6:00 pm')) {
        answer = 'Standard working hours are 9:00 AM to 6:00 PM, Monday through Friday.';
      }
    } else if (lowerUser.includes('sick leave')) {
      if (lowerSystem.includes('10 sick leave days')) {
        answer = 'Employees are entitled to 10 sick leave days per calendar year.';
      }
    }

    // Stream word by word
    const words = answer.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield (i === 0 ? '' : ' ') + words[i];
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
  }

  async completeChat(
    messages: LlmChatMessage[],
    options?: LlmOptions,
  ): Promise<string> {
    let text = '';
    for await (const token of this.streamChat(messages, options)) {
      text += token;
    }
    return text;
  }
}

