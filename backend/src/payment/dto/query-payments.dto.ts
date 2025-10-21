import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsUUID,
  Min,
  Max,
  Transform,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../common/types/payment-method.enum';
import { PaymentStatus } from '../../common/types/payment-status.enum';
import { TransactionType } from '../../entities/payment-transaction.entity';
import { RefundStatus } from '../../entities/payment-refund.entity';

export class QueryPaymentsDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID de la orden debe ser un UUID válido' })
  orderId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido' })
  userId?: string;

  @IsOptional()
  @IsEnum(PaymentMethod, { message: 'El método de pago no es válido' })
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'El estado del pago no es válido' })
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'El proveedor debe tener entre 2 y 100 caracteres' })
  provider?: string;

  @IsOptional()
  @IsString()
  @Length(10, 100, { message: 'La transacción externa debe tener entre 10 y 100 caracteres' })
  externalTransactionId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  endDate?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ min: 0 }, { message: 'El monto mínimo debe ser mayor o igual a 0' })
  minAmount?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ min: 0 }, { message: 'El monto máximo debe ser mayor o igual a 0' })
  maxAmount?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({ min: 1 }, { message: 'La página debe ser mayor a 0' })
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({ min: 1, max: 100 }, { message: 'El límite debe estar entre 1 y 100' })
  @Type(() => Number)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'El campo de búsqueda debe tener entre 1 y 50 caracteres' })
  search?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'El campo de ordenamiento debe tener entre 2 y 50 caracteres' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'El orden debe ser ASC o DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsEnum(TransactionType, { message: 'El tipo de transacción no es válido' })
  transactionType?: TransactionType;

  @IsOptional()
  @IsEnum(RefundStatus, { message: 'El estado del reembolso no es válido' })
  refundStatus?: RefundStatus;
}