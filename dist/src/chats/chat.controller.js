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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const express_1 = require("express");
class CreateChatDto {
}
class AddParticipantDto {
}
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async createChat(dto, req) {
        const user = req.user;
        if (!user)
            throw new common_1.ForbiddenException();
        return this.chatService.createChat(user.id, dto);
    }
    async listChats(req) {
        const user = req.user;
        if (!user)
            throw new common_1.ForbiddenException();
        return this.chatService.listChatsForUser(user.id);
    }
    async addParticipant(chatId, dto, req) {
        const user = req.user;
        if (!user)
            throw new common_1.ForbiddenException();
        return this.chatService.addParticipant(chatId, user.id, dto.userId);
    }
    async removeParticipant(chatId, userId, req) {
        const user = req.user;
        if (!user)
            throw new common_1.ForbiddenException();
        return this.chatService.removeParticipant(chatId, user.id, userId);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ whitelist: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateChatDto, typeof (_a = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _a : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createChat", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listChats", null);
__decorate([
    (0, common_1.Post)(':chatId/participants'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, AddParticipantDto, typeof (_c = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addParticipant", null);
__decorate([
    (0, common_1.Delete)(':chatId/participants/:userId'),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, typeof (_d = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "removeParticipant", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('api/chats'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map