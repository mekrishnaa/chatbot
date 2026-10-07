import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Res,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ChatService, ChatRequest } from './chat.service';

@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('chat')
  async chat(
    @Body() body: ChatRequest,
    @Res() res: Response,
    @Headers('x-organization-id') orgId?: string,
  ) {
    if (!body || !body.message || !body.message.trim()) {
      throw new BadRequestException('Message is required.');
    }
    return this.chatService.handleChatStream(body, res, orgId);
  }

  @Get('conversations')
  async getConversations(@Headers('x-organization-id') orgId?: string) {
    return this.chatService.getConversations(orgId);
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id') id: string,
    @Headers('x-organization-id') orgId?: string,
  ) {
    return this.chatService.getConversationById(id, orgId);
  }

  @Delete('conversations/:id')
  async deleteConversation(
    @Param('id') id: string,
    @Headers('x-organization-id') orgId?: string,
  ) {
    return this.chatService.deleteConversation(id, orgId);
  }
}

