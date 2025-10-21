import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';
import { PaymentMethod } from '../common/types/payment-method.enum';
import { PaymentStatus } from '../common/types/payment-status.enum';
import { PaymentTransaction } from './payment-transaction.entity';
import { PaymentRefund } from './payment-refund.entity';

@Entity('payments')
@Index(['orderId'])
@Index(['userId'])
@Index(['status'])
@Index(['method'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, order => order.payments, { onDelete: 'CASCADE' })
  order: Order;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, user => user.payments)
  user: User;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    comment: 'Método de pago utilizado'
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    comment: 'Estado actual del pago'
  })
  status: PaymentStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Monto total del pago en COP'
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Monto del impuesto en COP'
  })
  taxAmount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Monto de la comisión de la plataforma en COP'
  })
  platformFee: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Monto neto a recibir por el técnico en COP'
  })
  netAmount: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID de transacción externo (Wompi, Mercado Pago, etc.)'
  })
  externalTransactionId: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Proveedor de pago (wompi, mercadopago, etc.)'
  })
  provider: string | null;

  // Información para tarjetas
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Últimos 4 dígitos de la tarjeta'
  })
  cardLastFour: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Franquicia de la tarjeta (visa, mastercard, etc.)'
  })
  cardBrand: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Banco emisor de la tarjeta'
  })
  cardBank: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Token de la tarjeta para pagos recurrentes'
  })
  cardToken: string | null;

  // Información para transferencias PSE
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Banco para transferencia PSE'
  })
  pseBank: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Tipo de persona para PSE (natural, juridica)'
  })
  psePersonType: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Número de identificación para PSE'
  })
  pseIdentificationNumber: string | null;

  // Información para créditos
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Entidad de crédito'
  })
  creditEntity: string | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Número de cuotas para crédito'
  })
  creditInstallments: number | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Tasa de interés del crédito'
  })
  creditInterestRate: number | null;

  // Información para métodos digitales
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Número de teléfono para Nequi/Daviplata'
  })
  phoneNumber: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Email para notificaciones'
  })
  notificationEmail: string | null;

  // Información de aprobación
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Código de aprobación del pago'
  })
  approvalCode: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Mensaje de respuesta del procesador'
  })
  responseMessage: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Respuesta completa del procesador de pagos'
  })
  processorResponse: any;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL de redirección para pagos 3DS o PSE'
  })
  redirectUrl: string | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de aprobación del pago'
  })
  approvedAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de falla del pago'
  })
  failedAt: Date | null;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Fecha y hora de reembolso'
  })
  refundedAt: Date | null;

  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
    comment: 'Motivo de falla o reembolso'
  })
  failureReason: string | null;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica si el pago requiere revisión manual'
  })
  requiresReview: boolean;

  @Column({
    type: 'varchar',
    length: 1000,
    nullable: true,
    comment: 'Notas adicionales sobre el pago'
  })
  notes: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'IP desde donde se realizó el pago'
  })
  ipAddress: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'User Agent del navegador'
  })
  userAgent: string | null;

  @OneToMany(() => PaymentTransaction, transaction => transaction.payment)
  transactions: PaymentTransaction[];

  @OneToMany(() => PaymentRefund, refund => refund.payment)
  refunds: PaymentRefund[];

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Fecha de creación del registro'
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
    comment: 'Fecha de última actualización'
  })
  updatedAt: Date;
}