import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from '../entities/chat.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { Message } from '../entities/message.entity';
import { ChatFile } from '../entities/chat-file.entity';
import { FilesService } from '../files/files.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat) private chatRepo: Repository<Chat>,
    @InjectRepository(ChatParticipant) public partRepo: Repository<ChatParticipant>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(ChatFile) private fileRepo: Repository<ChatFile>,
    private readonly filesService: FilesService,
  ) {}

  async createChat(ownerId: string, dto: { type: 'single' | 'group'; title?: string; description?: string; participants: string[] }) {
    if (dto.type === 'single') {
      // single chat between owner and first participant (participants[0])
      const other = dto.participants[0];
      if (!other) throw new Error('Participant required for single chat');
      // check existing single chat between these users
      const existing = await this.chatRepo.createQueryBuilder('c')
        .innerJoin('chat_participants', 'p', 'p.chatId = c.id')
        .where('c.type = :type', { type: 'single' })
        .andWhere('p.userId IN (:...users)', { users: [ownerId, other] })
        .getMany();

      // naive check — in prod нужно гарантированно искать chat with exactly two participants
      if (existing && existing.length > 0) return existing[0];
    }

    const chat = this.chatRepo.create({
      type: dto.type,
      title: dto.title,
      description: dto.description,
      ownerId: ownerId
    });
    const saved = await this.chatRepo.save(chat);

    // create participants (include owner)
    const toAdd = Array.from(new Set([ownerId, ...(dto.participants || [])]));
    const parts = toAdd.map(uId => this.partRepo.create({
      chat: saved as any,
      userId: uId,
      role: uId === ownerId ? 'owner' : 'participant'
    }));
    await this.partRepo.save(parts);
    return { chat: saved, participants: parts };
  }

  async listChatsForUser(userId: string) {
    // get chats and last message
    const parts = await this.partRepo.find({ where: { userId }, relations: ['chat'] });
    const chats = [];
    for (const p of parts) {
      const last = await this.msgRepo.findOne({ where: { chat: { id: p.chat.id } }, order: { createdAt: 'DESC' } });
      chats.push({ chat: p.chat, role: p.role, lastMessage: last ? { id: last.id, metadata: last.metadata, createdAt: last.createdAt } : null });
    }
    return chats;
  }

  async isUserInChat(userId: string, chatId: string) {
    const p = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId } });
    return !!p;
  }

  async addParticipant(chatId: string, actorUserId: string, userIdToAdd: string) {
    // only owner or admin (with rights) can add — simplified: owner/admin allowed
    const actor = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId: actorUserId } });
    if (!actor) throw new ForbiddenException('Not participant');
    if (actor.role !== 'owner' && actor.role !== 'admin') throw new ForbiddenException('No rights');

    const existing = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId: userIdToAdd } });
    if (existing) return existing;

    const part = this.partRepo.create({ chat: { id: chatId } as any, userId: userIdToAdd, role: 'participant' });
    return this.partRepo.save(part);
  }

  async removeParticipant(chatId: string, actorUserId: string, userIdToRemove: string) {
    const actor = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId: actorUserId } });
    if (!actor) throw new ForbiddenException('Not participant');
    if (actor.role !== 'owner' && actor.role !== 'admin') throw new ForbiddenException('No rights');

    if (userIdToRemove === actorUserId && actor.role === 'owner') throw new ForbiddenException('Owner cannot remove themselves');

    const target = await this.partRepo.findOne({ where: { chat: { id: chatId }, userId: userIdToRemove } });
    if (!target) throw new NotFoundException('Participant not found');
    return this.partRepo.remove(target);
  }

  // Save message and attach files
  async createMessage(senderId: string, chatId: string, encryptedPayloadBuffer: Buffer | null, metadata: any) {
    // ensure participant
    const isIn = await this.isUserInChat(senderId, chatId);
    if (!isIn) throw new ForbiddenException('User not in chat');

    const msg = this.msgRepo.create({
      chat: { id: chatId } as any,
      senderId,
      encryptedPayload: encryptedPayloadBuffer,
      metadata
    });
    const saved = await this.msgRepo.save(msg);

    // attach files if any
    const attachments: string[] = metadata?.attachments || [];
    if (attachments && attachments.length > 0) {
      await this.filesService.attachFilesToMessage(attachments, saved.id);
    }

    // return DTO for WS (not decrypting here)
    return {
      id: saved.id,
      chatId,
      senderId,
      metadata: saved.metadata,
      createdAt: saved.createdAt,
      encryptedPayload: encryptedPayloadBuffer ? encryptedPayloadBuffer.toString('base64') : null
    };
  }
}
