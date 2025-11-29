import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionService {
  private sessions = new Map<string, Set<string>>();

  add(userId: string, socketId: string) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, new Set());
    }
    this.sessions.get(userId)!.add(socketId);
  }

  remove(userId: string, socketId: string) {
    if (!this.sessions.has(userId)) return;

    const set = this.sessions.get(userId)!;
    set.delete(socketId);

    if (set.size === 0) {
      this.sessions.delete(userId);
    }
  }

  getUserSockets(userId: string): string[] {
    return Array.from(this.sessions.get(userId) || []);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.sessions.keys());
  }

  isOnline(userId: string): boolean {
    return this.sessions.has(userId);
  }
}