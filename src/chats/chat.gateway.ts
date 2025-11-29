import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SessionService } from '../session/session.service';
import { FilesService } from '../files/files.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly filesService: FilesService,
    private readonly sessionService: SessionService,
    private readonly chatService: ChatService,
  ) {}

  
  // Подключение пользователя
  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers.authorization ||
      client.handshake.headers.cookie;

    if (!token) {
      client.disconnect();
      return;
    }

    // тут надо заменить на реальный метод получения userId из Auth service
    const userId = this.extractUserId(token);
    if (!userId) {
      client.disconnect();
      return;
    }

    // Привязываем сокет к userId
    client.data.userId = userId;

    this.sessionService.add(userId, client.id);

    // уведомляем всех друзей
    this.server.emit('user_online', { userId });
  }

  
  // Отключение пользователя
  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    this.sessionService.remove(userId, client.id);

    // пользователь полностью вышел (нет сессий)
    if (!this.sessionService.isOnline(userId)) {
      this.server.emit('user_offline', { userId });
    }
  }

  // Временное получение userId
  private extractUserId(token: string): string | null {
    // Временно — просто возвращаем токен как userId
    // Потом подключим Api.Auth
    return token?.toString() || null;
  }

 
  // Отправка сообщения
  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { chatId: string; encrypted: string; metadata: any },
  ) {
    const userId = client.data.userId;

    const encryptedBuffer = payload.encrypted
      ? Buffer.from(payload.encrypted, 'base64')
      : null;

    const msg = await this.chatService.createMessage(
      userId,
      payload.chatId,
      encryptedBuffer,
      payload.metadata,
    );

    // уведомляем всех участников чата
    const participants = await this.chatService.partRepo.find({
      where: { chat: { id: payload.chatId } },
    });

    participants.forEach((p) => {
      const sockets = this.sessionService.getUserSockets(p.userId);
      sockets.forEach((sockId) => {
        this.server.to(sockId).emit('new_message', msg);
      });
    });

    return msg;
  }

  
  // typing
  @SubscribeMessage('typing')
  async typing(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { chatId: string },
  ) {
    const userId = client.data.userId;

    const participants = await this.chatService.partRepo.find({
      where: { chat: { id: payload.chatId } },
    });

    participants
      .filter((p) => p.userId !== userId)
      .forEach((p) => {
        const sockets = this.sessionService.getUserSockets(p.userId);
        sockets.forEach((sockId) => {
          this.server.to(sockId).emit('typing', {
            chatId: payload.chatId,
            userId,
          });
        });
      });
  }
}
