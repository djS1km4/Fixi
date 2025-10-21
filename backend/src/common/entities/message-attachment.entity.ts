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

export enum AttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  LOCATION = 'LOCATION',
  CONTACT = 'CONTACT',
}

@Entity('message_attachments')
@Index(['messageId'])
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @ManyToOne(() => MessageEntity, message => message.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: MessageEntity;

  @Column({
    type: 'enum',
    enum: AttachmentType,
    comment: 'Tipo de archivo adjunto'
  })
  type: AttachmentType;

  @Column({
    type: 'varchar',
    length: 500,
    comment: 'URL del archivo'
  })
  url: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Nombre original del archivo'
  })
  originalName: string | null;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'MIME type del archivo'
  })
  mimeType: string | null;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: 'Tamaño del archivo en bytes'
  })
  size: number | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL del thumbnail para imágenes/videos'
  })
  thumbnailUrl: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Ancho del archivo en píxeles'
  })
  width: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Alto del archivo en píxeles'
  })
  height: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Duración del audio/video en segundos'
  })
  duration: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadatos adicionales del archivo'
  })
  metadata: any;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si el archivo está descargable'
  })
  isDownloadable: boolean;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de descargas del archivo'
  })
  downloadCount: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de expiración del archivo'
  })
  expiresAt: Date | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID del archivo en el servicio de almacenamiento'
  })
  storageFileId: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Servicio de almacenamiento (s3, gcs, azure, etc)'
  })
  storageProvider: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Fecha de creación del adjunto'
  })
  createdAt: Date;
}