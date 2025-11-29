"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const chat_module_1 = require("./chats/chat.module");
const session_middleware_1 = require("./auth/session.middleware");
const user_entity_1 = require("./entities/user.entity");
const chat_entity_1 = require("./entities/chat.entity");
const chat_participant_entity_1 = require("./entities/chat-participant.entity");
const message_entity_1 = require("./entities/message.entity");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(session_middleware_1.SessionMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'postgres',
                url: process.env.DATABASE_URL || 'postgresql://chat_user:chat_pass@127.0.0.1:5432/chat_db?schema=public',
                entities: [user_entity_1.User, chat_entity_1.Chat, chat_participant_entity_1.ChatParticipant, message_entity_1.Message],
                synchronize: true,
            }),
            auth_module_1.AuthModule,
            chat_module_1.ChatModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map