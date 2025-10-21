import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  MinLength,
  MaxLength,
  ValidateNested,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class CreateOrderDto {
  @IsString()
  @MinLength(10)
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNotes?: string;

  @IsOptional()
  @ValidateNested()
  serviceDetails?: ServiceDetailsDto;

  @IsOptional()
  @IsNumber()
  estimatedPrice?: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerAddress?: string;

  @IsOptional()
  @ValidateNested()
  customerLocation?: LocationDto;

  @IsOptional()
  @IsArray()
  preferredTechnicianIds?: string[];
}

export class ServiceDetailsDto {
  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  issues?: string[];

  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;
}

export class LocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerAddress?: string;

  @IsOptional()
  @ValidateNested()
  customerLocation?: LocationDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  technicianNotes?: string;

  @IsOptional()
  @ValidateNested()
  resolutionDetails?: ResolutionDetailsDto;
}

export class ResolutionDetailsDto {
  @IsOptional()
  @IsNumber()
  refundAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  refundReason?: string;
}