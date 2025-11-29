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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_file_entity_1 = require("../entities/chat-file.entity");
const chat_participant_entity_1 = require("../entities/chat-participant.entity");
let FilesService = class FilesService {
    constructor(filesRepo, partRepo) {
        this.filesRepo = filesRepo;
        this.partRepo = partRepo;
    }
    async createFileRecord(uploaderId, { filename, path, mimeType, size, chatId }) {
        const rec = this.filesRepo.create({
            uploaderId,
            filename,
            path,
            mimeType,
            size,
            chat: chatId ? { id: chatId } : null,
            messageId: null,
        });
        return this.filesRepo.save(rec);
    }
    async getFileById(id) {
        const f = await this.filesRepo.findOne({ where: { id } });
        if (!f)
            throw new common_1.NotFoundException('File not found');
        return f;
    }
    async checkAccessToFile(userId, fileId) {
        const f = await this.filesRepo.findOne({ where: { id: fileId }, relations: ['chat'] });
        if (!f)
            throw new common_1.NotFoundException('File not found');
        if (f.uploaderId === userId)
            return f;
        if (!f.chat)
            throw new common_1.ForbiddenException('No access');
        const part = await this.partRepo.findOne({ where: { chat: { id: f.chat.id }, userId } });
        if (!part)
            throw new common_1.ForbiddenException('No access to file');
        return f;
    }
    async attachFilesToMessage(fileIds, messageId) {
        if (!fileIds || fileIds.length === 0)
            return;
        await this.filesRepo.createQueryBuilder()
            .update()
            .set({ messageId })
            .where('id = ANY(:ids)', { ids: fileIds })
            .execute();
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_file_entity_1.ChatFile)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_participant_entity_1.ChatParticipant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FilesService);
//# sourceMappingURL=files.service.js.map