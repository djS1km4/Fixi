import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  Length,
  Min,
  Max,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { RefundReason } from '../../entities/payment-refund.entity';

export class RefundPaymentDto {
  @IsUUID('4', { message: 'El ID del pago debe ser un UUID válido' })
  paymentId: string;

  @IsNumber({ min: 1000 }, { message: 'El monto del reembolso debe ser mayor a $1,000 COP' })
  amount: number;

  @IsEnum(RefundReason, { message: 'La razón del reembolso no es válida' })
  reason: RefundReason;

  @IsOptional()
  @IsString()
  @Length(2, 1000, { message: 'La descripción debe tener entre 2 y 1000 caracteres' })
  description?: string;

  @IsOptional()
  @IsString()
  @Length(2, 1000, { message: 'Las notas deben tener entre 2 y 1000 caracteres' })
  notes?: string;

  @IsOptional()
  @IsBoolean()
  @IsOptional({ message: 'El campo notifyCustomer debe ser booleano' })
  notifyCustomer?: boolean = true;

  @IsOptional()
  @IsBoolean()
  @IsOptional({ message: 'El campo notifyTechnician debe ser booleano' })
  notifyTechnician?: boolean = true;

  @IsOptional()
  @IsString()
  @Length(2, 500, { message: 'La referencia interna debe tener entre 2 y 500 caracteres' })
  internalReference?: string;
}