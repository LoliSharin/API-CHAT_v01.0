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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_entity_1 = require("../entities/chat.entity");
const chat_participant_entity_1 = require("../entities/chat-participant.entity");
const message_entity_1 = require("../entities/message.entity");
const chat_file_entity_1 = require("../entities/chat-file.entity");
const files_service_1 = require("../files/files.service");
let ChatService = class ChatService {
    constructor(chatRepo, partRepo, msgRepo, fileRepo, filesService) {
        this.chatRepo = chatRepo;
        this.partRepo = partRepo;
        this.msgRepo = msgRepo;
        this.fileRepo = fileRepo;
        this.filesService = filesService;
    }
    async createChat(ownerId, dto) {
        if (dto.type === 'single') {
            const other = dto.participants[0];
            if (!other)
                throw new Error('Participant required for single chat');
            const existing = await this.chatRepo.createQueryBuilder('c')
                .innerJoin('chat_participants', 'p', 'p.chatId = c.id')
                .where('c.type = :type', { type: 'single' })
                .andWhere('p.userId IN (:...users)', { users: [ownerId, other] })
                .getMany();
            if (existing && existing.length > 0)
                return existing[0];
        }
        const chat = this.chatRepo.create({
            type: dto.type,
            title: dto.title,
            description: dto.description,
            ownerId: ownerId
        });
        const saved = await this.chatRepo.save(chat);
        const toAdd = Array.from(new Set([ownerId, ...(dto.participants || [])]));
        const parts = toAdd.map(uId => this.partRepo.create({
            chat: saved,
            userId: uId,
            role: uId === ownerId ? 'owner' : 'participant'
        }));
        await this.partRepo.save(parts);
        return { chat: saved, participants: parts };
    }
    async listChatsForUser(userId) {
        const parts = await this.partRepo.find({ where: { userId }, relations: ['chat'] });
        const chats = [];
        for (const p of parts) {
            const last = await this.msgRepo.findOne({ where: { chat: { id: p.chat.id } }, order: { createdAt: 'DESC' } });
            chats.push({ chat: p.chat, role: p.role, lastMessage: last ? { id: last.id, metadata: last.metadata, createdAt: last.createdAt } : null });
        }
        return chats;
    }
    async isUserInChat(userId, chatId) {
        const p = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId } });
        return !!p;
    }
    async addParticipant(chatId, actorUserId, userIdToAdd) {
        const actor = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId: actorUserId } });
        if (!actor)
            throw new common_1.ForbiddenException('Not participant');
        if (actor.role !== 'owner' && actor.role !== 'admin')
            throw new common_1.ForbiddenException('No rights');
        const existing = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId: userIdToAdd } });
        if (existing)
            return existing;
        const part = this.partRepo.create({ chat: { id: chatId }, userId: userIdToAdd, role: 'participant' });
        return this.partRepo.save(part);
    }
    async removeParticipant(chatId, actorUserId, userIdToRemove) {
        const actor = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId: actorUserId } });
        if (!actor)
            throw new common_1.ForbiddenException('Not participant');
        if (actor.role !== 'owner' && actor.role !== 'admin')
            throw new common_1.ForbiddenException('No rights');
        if (userIdToRemove === actorUserId && actor.role === 'owner')
            throw new common_1.ForbiddenException('Owner cannot remove themselves');
        const target = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId: userIdToRemove } });
        if (!target)
            throw new common_1.NotFoundException('Participant not found');
        return this.partRepo.remove(target);
    }
    async createMessage(senderId, chatId, encryptedPayloadBuffer, metadata) {
        const isIn = await this.isUserInChat(senderId, chatId);
        if (!isIn)
            throw new common_1.ForbiddenException('User not in chat');
        const msg = this.msgRepo.create({
            chat: { id: chatId },
            senderId,
            encryptedPayload: encryptedPayloadBuffer,
            metadata
        });
        const saved = await this.msgRepo.save(msg);
        const attachments = metadata?.attachments || [];
        if (attachments && attachments.length > 0) {
            await this.filesService.attachFilesToMessage(attachments, saved.id);
        }
        return {
            id: saved.id,
            chatId,
            senderId,
            metadata: saved.metadata,
            createdAt: saved.createdAt,
            encryptedPayload: encryptedPayloadBuffer ? encryptedPayloadBuffer.toString('base64') : null
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_entity_1.Chat)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_participant_entity_1.ChatParticipant)),
    __param(2, (0, typeorm_1.InjectRepository)(message_entity_1.Message)),
    __param(3, (0, typeorm_1.InjectRepository)(chat_file_entity_1.ChatFile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        files_service_1.FilesService])
], ChatService);
//# sourceMappingURL=chat.service.js.map