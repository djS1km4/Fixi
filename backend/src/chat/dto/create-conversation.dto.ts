import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConversationType } from '../../common/entities/conversation.entity';

export class CreateConversationDto {
  @IsUUID('4', { message: 'El ID del primer participante debe ser un UUID válido' })
  participant1Id: string;

  @IsUUID('4', { message: 'El ID del segundo participante debe ser un UUID válido' })
  participant2Id: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de la orden debe ser un UUID válido' })
  orderId?: string;

  @IsOptional()
  @IsEnum(ConversationType, { message: 'El tipo de conversación no es válido' })
  type?: ConversationType;

  @IsOptional()
  @IsString({ message: 'El título debe ser texto' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  metadata?: any;
}

export class CreateSupportConversationDto {
  @IsUUID('4', { message: 'El ID de la orden debe ser un UUID válido' })
  orderId: string;

  @IsOptional()
  @IsString({ message: 'El título debe ser texto' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;
}

export class UpdateConversationDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser texto' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'El avatar debe ser una URL válida' })
  @MaxLength(500, { message: 'La URL del avatar no puede exceder 500 caracteres' })
  avatar?: string;

  @IsOptional()
  metadata?: any;

  @IsOptional()
  notificationSettings?: any;
}

export class MarkMessagesAsReadDto {
  @IsArray({ message: 'Los IDs de mensajes deben ser un arreglo' })
  messageIds: string[];

  @IsOptional()
  deviceInfo?: {
    device?: string;
    userAgent?: string;
    ipAddress?: string;
    country?: string;
    city?: string;
  };
}