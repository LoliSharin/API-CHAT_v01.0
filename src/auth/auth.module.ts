import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SessionService } from './session.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [SessionService],
  exports: [SessionService],
})
export class AuthModule {}