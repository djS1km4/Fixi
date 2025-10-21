import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { UserEntity } from './user.entity';
import { MessageAttachment } from './message-attachment.entity';
import { MessageRead } from './message-read.entity';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  LOCATION = 'LOCATION',
  SYSTEM = 'SYSTEM',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

@Entity('messages')
@Index(['orderId'])
@Index(['senderId'])
@Index(['receiverId'])
@Index(['status'])
@Index(['type'])
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @ManyToOne(() => OrderEntity, order => order.messages, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity | null;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @ManyToOne(() => UserEntity, user => user.sentMessages)
  @JoinColumn({ name: 'sender_id' })
  sender: UserEntity;

  @Column({ name: 'receiver_id', type: 'uuid', nullable: true })
  receiverId: string | null;

  @ManyToOne(() => UserEntity, user => user.receivedMessages, { nullable: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver: UserEntity | null;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
    comment: 'Tipo de mensaje'
  })
  type: MessageType;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Contenido del mensaje de texto'
  })
  content: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadatos del mensaje'
  })
  metadata: any;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT,
    comment: 'Estado del mensaje'
  })
  status: MessageStatus;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Mensaje de error si falla el envío'
  })
  errorMessage: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de entrega'
  })
  deliveredAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de lectura'
  })
  readAt: Date | null;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si el mensaje ha sido editado'
  })
  isEdited: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de la última edición'
  })
  editedAt: Date | null;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si el mensaje ha sido eliminado'
  })
  isDeleted: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de eliminación'
  })
  deletedAt: Date | null;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID del mensaje respondido'
  })
  replyToId: string | null;

  @ManyToOne(() => MessageEntity, { nullable: true })
  @JoinColumn({ name: 'reply_to_id' })
  replyTo: MessageEntity | null;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID del mensaje reenviado'
  })
  forwardFromId: string | null;

  @ManyToOne(() => MessageEntity, { nullable: true })
  @JoinColumn({ name: 'forward_from_id' })
  forwardFrom: MessageEntity | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID del mensaje externo (para integraciones)'
  })
  externalMessageId: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Plataforma externa del mensaje'
  })
  externalPlatform: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'IP desde donde se envió el mensaje'
  })
  ipAddress: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'User Agent del emisor'
  })
  userAgent: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: 'País del emisor'
  })
  country: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Ciudad del emisor'
  })
  city: string | null;

  @OneToMany(() => MessageAttachment, attachment => attachment.message)
  attachments: MessageAttachment[];

  @OneToMany(() => MessageRead, messageRead => messageRead.message)
  readReceipts: MessageRead[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Fecha de creación del mensaje'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: 'Fecha de última actualización'
  })
  updatedAt: Date;
}