import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
  Transform,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../../common/entities/message.entity';

export class QueryMessagesDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(100, { message: 'El límite no puede ser mayor a 100' })
  limit?: number = 50;

  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  @MaxLength(100, { message: 'La búsqueda no puede exceder 100 caracteres' })
  search?: string;

  @IsOptional()
  @IsEnum(MessageType, { message: 'El tipo de mensaje no es válido' })
  type?: MessageType;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  endDate?: string;

  @IsOptional()
  @IsString({ message: 'El ordenamiento debe ser texto' })
  @MaxLength(50, { message: 'El ordenamiento no puede exceder 50 caracteres' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString({ message: 'La dirección debe ser ASC o DESC' })
  orderDirection?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @Transform(({ value }) => value === 'true' })
  includeDeleted?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => value === 'true' })
  onlyUnread?: boolean = false;
}

export class QueryConversationsDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor a 0' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor a 0' })
  @Max(50, { message: 'El límite no puede ser mayor a 50' })
  limit?: number = 20;

  @IsOptional()
  @IsString({ message: 'La búsqueda debe ser texto' })
  @MaxLength(100, { message: 'La búsqueda no puede exceder 100 caracteres' })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' })
  onlyWithUnread?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => value === 'true' })
  onlyMuted?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => value === 'true' })
  onlyPinned?: boolean = false;

  @IsOptional()
  @Transform(({ value }) => value === 'true' })
  onlyActive?: boolean = true;

  @IsOptional()
  @IsString({ message: 'El ordenamiento debe ser texto' })
  @MaxLength(50, { message: 'El ordenamiento no puede exceder 50 caracteres' })
  sortBy?: string = 'lastMessageAt';

  @IsOptional()
  @IsString({ message: 'La dirección debe ser ASC o DESC' })
  orderDirection?: 'ASC' | 'DESC' = 'DESC';
}