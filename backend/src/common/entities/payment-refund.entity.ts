import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';
import { PaymentMethod } from '../common/types/payment-method.enum';

export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum RefundReason {
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  TECHNICIAN_NOT_AVAILABLE = 'TECHNICIAN_NOT_AVAILABLE',
  SERVICE_CANCELLED = 'SERVICE_CANCELLED',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  DUPLICATE_PAYMENT = 'DUPLICATE_PAYMENT',
  FRAUDULENT_TRANSACTION = 'FRAUDULENT_TRANSACTION',
  AGREEMENT = 'AGREEMENT',
  OTHER = 'OTHER',
}

@Entity('payment_refunds')
@Index(['paymentId'])
@Index(['status'])
@Index(['reason'])
export class PaymentRefund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId: string;

  @ManyToOne(() => Payment, payment => payment.refunds)
  payment: Payment;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING,
    comment: 'Estado del reembolso'
  })
  status: RefundStatus;

  @Column({
    type: 'enum',
    enum: RefundReason,
    comment: 'Razón del reembolso'
  })
  reason: RefundReason;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Monto del reembolso en COP'
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Monto de comisión de reembolso en COP'
  })
  fee: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Monto neto reembolsado en COP'
  })
  netAmount: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID de reembolso externo del procesador'
  })
  externalRefundId: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Proveedor de pago (wompi, mercadopago, etc.)'
  })
  provider: string | null;

  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
    comment: 'Descripción detallada del motivo del reembolso'
  })
  description: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Respuesta del procesador de pagos'
  })
  processorResponse: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Código de autorización del reembolso'
  })
  authorizationCode: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de procesamiento del reembolso'
  })
  processedAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de finalización del reembolso'
  })
  completedAt: Date | null;

  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
    comment: 'Motivo de falla del reembolso'
  })
  failureReason: string | null;

  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
    comment: 'Notas adicionales sobre el reembolso'
  })
  notes: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'ID del usuario que solicita el reembolso'
  })
  requestedBy: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'ID del usuario que aprueba el reembolso'
  })
  approvedBy: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Fecha de creación del reembolso'
  })
  createdAt: Date;
}