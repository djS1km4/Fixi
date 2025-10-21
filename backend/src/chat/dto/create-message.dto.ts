import {
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsUUID,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { MessageType } from '../../common/entities/message.entity';
import { AttachmentType } from '../../common/entities/message-attachment.entity';

export class MessageAttachmentDto {
  @IsEnum(AttachmentType, { message: 'El tipo de archivo no es válido' })
  type: AttachmentType;

  @IsUrl({}, { message: 'La URL del archivo no es válida' })
  url: string;

  @IsOptional()
  @IsString({ message: 'El nombre original debe ser texto' })
  @MaxLength(255, { message: 'El nombre original no puede exceder 255 caracteres' })
  originalName?: string;

  @IsOptional()
  @IsString({ message: 'El MIME type debe ser texto' })
  @MaxLength(255, { message: 'El MIME type no puede exceder 255 caracteres' })
  mimeType?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El tamaño debe ser un número' })
  size?: number;

  @IsOptional()
  @IsUrl({}, { message: 'La URL del thumbnail no es válida' })
  thumbnailUrl?: string;

  @IsOptional()
  @IsString({ message: 'El ancho debe ser texto' })
  @MaxLength(50, { message: 'El ancho no puede exceder 50 caracteres' })
  width?: string;

  @IsOptional()
  @IsString({ message: 'El alto debe ser texto' })
  @MaxLength(50, { message: 'El alto no puede exceder 50 caracteres' })
  height?: string;

  @IsOptional()
  @IsString({ message: 'La duración debe ser texto' })
  @MaxLength(50, { message: 'La duración no puede exceder 50 caracteres' })
  duration?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsString({ message: 'El ID del archivo debe ser texto' })
  @MaxLength(100, { message: 'El ID del archivo no puede exceder 100 caracteres' })
  storageFileId?: string;

  @IsOptional()
  @IsString({ message: 'El proveedor debe ser texto' })
  @MaxLength(50, { message: 'El proveedor no puede exceder 50 caracteres' })
  storageProvider?: string;
}

export class CreateMessageDto {
  @IsUUID('4', { message: 'El ID de la conversación debe ser un UUID válido' })
  conversationId: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la orden debe ser un UUID válido' })
  orderId?: string;

  @IsOptional()
  @IsEnum(MessageType, { message: 'El tipo de mensaje no es válido' })
  type?: MessageType;

  @IsOptional()
  @IsString({ message: 'El contenido debe ser texto' })
  @MaxLength(4000, { message: 'El contenido no puede exceder 4000 caracteres' })
  content?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  @IsArray({ message: 'Los adjuntos deben ser un arreglo' })
  attachments?: MessageAttachmentDto[];

  @IsOptional()
  @IsUUID('4', { message: 'El ID del mensaje respondido debe ser un UUID válido' })
  replyToId?: string;

  @IsOptional()
  @IsString({ message: 'El ID del mensaje externo debe ser texto' })
  @MaxLength(100, { message: 'El ID del mensaje externo no puede exceder 100 caracteres' })
  externalMessageId?: string;

  @IsOptional()
  @IsString({ message: 'La plataforma externa debe ser texto' })
  @MaxLength(50, { message: 'La plataforma externa no puede exceder 50 caracteres' })
  externalPlatform?: string;

  @IsOptional()
  @IsString({ message: 'La IP debe ser texto' })
  @MaxLength(45, { message: 'La IP no puede exceder 45 caracteres' })
  ipAddress?: string;

  @IsOptional()
  @IsString({ message: 'El User Agent debe ser texto' })
  @MaxLength(500, { message: 'El User Agent no puede exceder 500 caracteres' })
  userAgent?: string;

  @IsOptional()
  @IsString({ message: 'El país debe ser texto' })
  @MaxLength(10, { message: 'El país no puede exceder 10 caracteres' })
  country?: string;

  @IsOptional()
  @IsString({ message: 'La ciudad debe ser texto' })
  @MaxLength(50, { message: 'La ciudad no puede exceder 50 caracteres' })
  city?: string;
}

export class SendMessageDto extends CreateMessageDto {
  @IsOptional()
  @IsBoolean({ message: 'Enviar notificación debe ser booleano' })
  sendNotification?: boolean = true;

  @IsOptional()
  @IsBoolean({ message: 'Enviar email debe ser booleano' })
  sendEmail?: boolean = false;

  @IsOptional()
  @IsBoolean({ message: 'Enviar SMS debe ser booleano' })
  sendSms?: boolean = false;
}