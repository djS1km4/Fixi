import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsEmail,
  Length,
  Min,
  Max,
  ValidateNested,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../common/types/payment-method.enum';

export class CardPaymentDto {
  @IsString()
  @Length(13, 19, { message: 'El número de tarjeta debe tener entre 13 y 19 dígitos' })
  cardNumber: string;

  @IsString()
  @Length(2, 2, { message: 'El mes de expiración debe tener 2 dígitos' })
  @Min(1, { message: 'El mes de expiración debe ser entre 01 y 12' })
  @Max(12, { message: 'El mes de expiración debe ser entre 01 y 12' })
  expiryMonth: string;

  @IsString()
  @Length(4, 4, { message: 'El año de expiración debe tener 4 dígitos' })
  expiryYear: string;

  @IsString()
  @Length(3, 4, { message: 'El CVV debe tener entre 3 y 4 dígitos' })
  cvv: string;

  @IsString()
  @Length(2, 100, { message: 'El nombre del titular debe tener entre 2 y 100 caracteres' })
  cardholderName: string;

  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'El documento debe tener entre 2 y 50 caracteres' })
  documentId?: string;

  @IsOptional()
  @IsString()
  @Length(5, 10, { message: 'El código postal debe tener entre 5 y 10 caracteres' })
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(5, 200, { message: 'La dirección debe tener entre 5 y 200 caracteres' })
  address?: string;
}

export class PsePaymentDto {
  @IsString()
  @Length(2, 50, { message: 'El banco es requerido' })
  bank: string;

  @IsEnum(['natural', 'juridica'], { message: 'El tipo de persona debe ser natural o juridica' })
  personType: 'natural' | 'juridica';

  @IsEnum(['CC', 'CE', 'NIT', 'TI', 'PP', 'IDC', 'CEL', 'RC', 'DE'],
    { message: 'El tipo de documento no es válido' })
  documentType: string;

  @IsString()
  @Length(5, 20, { message: 'El número de documento debe tener entre 5 y 20 caracteres' })
  documentNumber: string;

  @IsString()
  @Length(2, 100, { message: 'El nombre es requerido' })
  firstName: string;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'El apellido debe tener entre 2 y 100 caracteres' })
  lastName?: string;

  @IsString()
  @Length(10, 15, { message: 'El teléfono debe tener entre 10 y 15 caracteres' })
  phone: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email: string;
}

export class NequiPaymentDto {
  @IsString()
  @Length(10, 15, { message: 'El número de teléfono Nequi debe tener entre 10 y 15 caracteres' })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'El nombre del titular debe tener entre 2 y 100 caracteres' })
  holderName?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'El token de seguridad debe tener 6 dígitos' })
  securityToken?: string;
}

export class DaviplataPaymentDto {
  @IsString()
  @Length(10, 15, { message: 'El número de teléfono Daviplata debe tener entre 10 y 15 caracteres' })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'El nombre del titular debe tener entre 2 y 100 caracteres' })
  holderName?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'El PIN debe tener 4-6 dígitos' })
  pin?: string;
}

export class CreditPaymentDto {
  @IsEnum(['credifi', 'addi', 'kueski', 'credito Colombia'],
    { message: 'La entidad de crédito no es válida' })
  creditEntity: string;

  @IsNumber({ min: 1, max: 48 }, { message: 'El número de cuotas debe estar entre 1 y 48' })
  installments: number;

  @IsOptional()
  @IsNumber({ min: 0, max: 100 }, { message: 'La tasa de interés debe estar entre 0 y 100' })
  interestRate?: number;

  @IsOptional()
  @IsString()
  @Length(5, 20, { message: 'El documento debe tener entre 5 y 20 caracteres' })
  documentId?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(10, 15, { message: 'El teléfono debe tener entre 10 y 15 caracteres' })
  phone?: string;
}

export class CashPaymentDto {
  @IsEnum(['BALOTO', 'EFECTY', 'SUFIRO'], { message: 'El tipo de pago en efectivo no es válido' })
  cashType: string;

  @IsString()
  @Length(2, 100, { message: 'El nombre del pagador es requerido' })
  payerName: string;

  @IsString()
  @Length(5, 20, { message: 'El documento es requerido' })
  documentId: string;

  @IsString()
  @Length(10, 15, { message: 'El teléfono es requerido' })
  phone: string;

  @IsEmail({}, { message: 'El email no es válido' })
  email: string;
}

export class CreatePaymentDto {
  @IsString()
  @Length(36, 36, { message: 'El ID de la orden es requerido' })
  orderId: string;

  @IsNumber({ min: 1000 }, { message: 'El monto debe ser mayor a $1,000 COP' })
  amount: number;

  @IsEnum(PaymentMethod, { message: 'El método de pago no es válido' })
  method: PaymentMethod;

  @IsOptional()
  @IsString()
  @Length(10, 15, { message: 'El teléfono debe tener entre 10 y 15 caracteres' })
  phoneNumber?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email no es válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @Length(2, 500, { message: 'Las notas deben tener entre 2 y 500 caracteres' })
  notes?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'La IP debe tener entre 2 y 100 caracteres' })
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @Length(2, 500, { message: 'El User Agent debe tener entre 2 y 500 caracteres' })
  userAgent?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CardPaymentDto)
  card?: CardPaymentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PsePaymentDto)
  pse?: PsePaymentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NequiPaymentDto)
  nequi?: NequiPaymentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DaviplataPaymentDto)
  daviplata?: DaviplataPaymentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditPaymentDto)
  credit?: CreditPaymentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CashPaymentDto)
  cash?: CashPaymentDto;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  savePaymentMethod?: boolean;

  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'El nombre del método de pago debe tener entre 2 y 100 caracteres' })
  paymentMethodNickname?: string;
}