import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { UserEntity } from './user.entity';

@Entity('message_reads')
@Index(['messageId'])
@Index(['userId'])
export class MessageRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @ManyToOne(() => MessageEntity, messageRead => messageRead.message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: MessageEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserEntity, user => user.readMessages)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({
    type: 'timestamp',
    comment: 'Fecha y hora de lectura del mensaje'
  })
  readAt: Date;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Dispositivo desde donde se leyó el mensaje'
  })
  device: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'User Agent del dispositivo'
  })
  userAgent: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'IP desde donde se leyó el mensaje'
  })
  ipAddress: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'País desde donde se leyó el mensaje'
  })
  country: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Ciudad desde donde se leyó el mensaje'
  })
  city: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Fecha de creación del registro de lectura'
  })
  createdAt: Date;
}