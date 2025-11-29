"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
let SessionService = class SessionService {
    constructor() {
        this.sessions = new Map();
    }
    add(userId, socketId) {
        if (!this.sessions.has(userId)) {
            this.sessions.set(userId, new Set());
        }
        this.sessions.get(userId).add(socketId);
    }
    remove(userId, socketId) {
        if (!this.sessions.has(userId))
            return;
        const set = this.sessions.get(userId);
        set.delete(socketId);
        if (set.size === 0) {
            this.sessions.delete(userId);
        }
    }
    getUserSockets(userId) {
        return Array.from(this.sessions.get(userId) || []);
    }
    getOnlineUsers() {
        return Array.from(this.sessions.keys());
    }
    isOnline(userId) {
        return this.sessions.has(userId);
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)()
], SessionService);
//# sourceMappingURL=session.service.js.map