import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChatParticipant } from './chat-participant.entity';
import { Message } from './message.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  type: 'single' | 'group';  // <-- ЭТО ДОЛЖНО БЫТЬ

  @Column()
  ownerId: string; // <-- ЭТО ТОЖЕ ОБЯЗАТЕЛЬНО

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => ChatParticipant, (p) => p.chat)
  participants: ChatParticipant[];

  @OneToMany(() => Message, (m) => m.chat)
  messages: Message[];
}