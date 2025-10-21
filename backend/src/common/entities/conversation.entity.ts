import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { UserEntity } from './user.entity';
import { OrderEntity } from './order.entity';

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  ORDER_SUPPORT = 'ORDER_SUPPORT',
  GENERAL_SUPPORT = 'GENERAL_SUPPORT',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

@Entity('conversations')
@Index(['orderId'])
@Index(['participant1Id'])
@Index(['participant2Id'])
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => OrderEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity | null;

  @Column({ name: 'participant_1_id', type: 'uuid' })
  participant1Id: string;

  @ManyToOne(() => UserEntity, user => user.conversationsAsParticipant1)
  @JoinColumn({ name: 'participant_1_id' })
  participant1: UserEntity;

  @Column({ name: 'participant_2_id', type: 'uuid' })
  participant2Id: string;

  @ManyToOne(() => UserEntity, user => user.conversationsAsParticipant2)
  @JoinColumn({ name: 'participant_2_id' })
  participant2: UserEntity;

  @Column({
    type: 'enum',
    enum: ConversationType,
    default: ConversationType.DIRECT,
    comment: 'Tipo de conversación'
  })
  type: ConversationType;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE,
    comment: 'Estado de la conversación'
  })
  status: ConversationStatus;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Título de la conversación'
  })
  title: string | null;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descripción de la conversación'
  })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL del avatar de la conversación'
  })
  avatar: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'ID del último mensaje'
  })
  lastMessageId: string | null;

  @ManyToOne(() => MessageEntity, { nullable: true })
  @JoinColumn({ name: 'last_message_id' })
  lastMessage: MessageEntity | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora del último mensaje'
  })
  lastMessageAt: Date | null;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número total de mensajes'
  })
  totalMessages: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de mensajes no leídos'
  })
  unreadCount: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si la conversación está silenciada'
  })
  isMuted: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si la conversación está fijada'
  })
  isPinned: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si la conversación está archivada'
  })
  isArchived: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadatos adicionales de la conversación'
  })
  metadata: any;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuración de notificaciones'
  })
  notificationSettings: any;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID de la conversación externa'
  })
  externalConversationId: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Plataforma externa de la conversación'
  })
  externalPlatform: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Fecha de creación de la conversación'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: 'Fecha de última actualización'
  })
  updatedAt: Date;
}