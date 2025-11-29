import { Controller, Post, Body, Req, Get, Param, UsePipes, ValidationPipe, ForbiddenException, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Request } from 'express';

class CreateChatDto {
  type: 'single' | 'group';
  title?: string;
  description?: string;
  participants: string[]; // массив userId
}

class AddParticipantDto {
  userId: string;
}

@Controller('api/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createChat(@Body() dto: CreateChatDto, @Req() req: Request) {
    const user = (req as any).user;
    if (!user) throw new ForbiddenException();
    return this.chatService.createChat(user.id, dto);
  }

  @Get()
  async listChats(@Req() req: Request) {
    const user = (req as any).user;
    if (!user) throw new ForbiddenException();
    return this.chatService.listChatsForUser(user.id);
  }

  @Post(':chatId/participants')
  async addParticipant(@Param('chatId') chatId: string, @Body() dto: AddParticipantDto, @Req() req: Request) {
    const user = (req as any).user;
    if (!user) throw new ForbiddenException();
    return this.chatService.addParticipant(chatId, user.id, dto.userId);
  }

  @Delete(':chatId/participants/:userId')
  async removeParticipant(@Param('chatId') chatId: string, @Param('userId') userId: string, @Req() req: Request) {
    const user = (req as any).user;
    if (!user) throw new ForbiddenException();
    return this.chatService.removeParticipant(chatId, user.id, userId);
  }
}