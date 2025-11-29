"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
const session_service_1 = require("../session/session.service");
const files_service_1 = require("../files/files.service");
let ChatGateway = class ChatGateway {
    constructor(filesService, sessionService, chatService) {
        this.filesService = filesService;
        this.sessionService = sessionService;
        this.chatService = chatService;
    }
    async handleConnection(client) {
        const token = client.handshake.auth?.token ||
            client.handshake.headers.authorization ||
            client.handshake.headers.cookie;
        if (!token) {
            client.disconnect();
            return;
        }
        const userId = this.extractUserId(token);
        if (!userId) {
            client.disconnect();
            return;
        }
        client.data.userId = userId;
        this.sessionService.add(userId, client.id);
        this.server.emit('user_online', { userId });
    }
    async handleDisconnect(client) {
        const userId = client.data.userId;
        if (!userId)
            return;
        this.sessionService.remove(userId, client.id);
        if (!this.sessionService.isOnline(userId)) {
            this.server.emit('user_offline', { userId });
        }
    }
    extractUserId(token) {
        return token?.toString() || null;
    }
    async sendMessage(client, payload) {
        const userId = client.data.userId;
        const encryptedBuffer = payload.encrypted
            ? Buffer.from(payload.encrypted, 'base64')
            : null;
        const msg = await this.chatService.createMessage(userId, payload.chatId, encryptedBuffer, payload.metadata);
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
    async typing(client, payload) {
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
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "sendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "typing", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [files_service_1.FilesService,
        session_service_1.SessionService,
        chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map