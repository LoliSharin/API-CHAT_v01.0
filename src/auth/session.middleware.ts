import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SessionService } from './session.service';
import * as cookie from 'cookie';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly sessionService: SessionService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionId = cookies['sessionId'];

    if (sessionId) {
      const user = await this.sessionService.getUserBySessionId(sessionId);
      if (user) {
        (req as any).user = { id: user.id, username: user.username, displayName: user.displayName };
      }
    }
    next();
  }
}