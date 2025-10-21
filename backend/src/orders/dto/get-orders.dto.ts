import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class GetOrdersDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsString()
  customer?: string;

  @IsOptional()
  @IsString()
  technician?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status' | 'price';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}