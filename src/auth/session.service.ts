import { Injectable, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';

@Injectable()
export class SessionService implements OnModuleInit {
  private redis: Redis;

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD ?? undefined,
    });
  }

  async createSessionForUser(userId: string, ttlSeconds = 14 * 24 * 3600) {
    const sessionId = randomUUID();
    const key = `session:${sessionId}`;
    await this.redis.set(key, JSON.stringify({ userId }), 'EX', ttlSeconds);
    return sessionId;
  }

  async getUserBySessionId(sessionId: string): Promise<User | null> {
    if (!sessionId) return null;
    const key = `session:${sessionId}`;
    const raw = await this.redis.get(key);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      const user = await this.userRepo.findOne({ where: { id: data.userId } });
      return user || null;
    } catch (e) {
      return null;
    }
  }

  async destroySession(sessionId: string) {
    const key = `session:${sessionId}`;
    await this.redis.del(key);
  }
}