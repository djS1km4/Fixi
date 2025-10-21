import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrderEntity } from '../../orders/entities/order.entity';
import { UserEntity } from './user.entity';
import { PaymentStatus } from '../types/payment-status.enum';
import { PaymentMethod } from '../types/payment-method.enum';

@Entity('payments')
@Index('idx_payments_order')
@Index('idx_payments_status')
@Index('idx_payments_method')
export class PaymentEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrderEntity, payment => payment.order)
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => UserEntity, payment => payment.customer)
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayTransactionId: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus
  })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  gatewayFee: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  currency: string;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  exchangeRate: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  gatewayResponse?: string;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt?: Date;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  refundReason?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  gatewayProvider?: string; // 'wompi', 'mercadopago'

  @Column({ type: 'jsonb', nullable: true })
  splitPayments?: {
    technicianAmount?: number;
    platformAmount?: number;
    transactionId?: string;
    paymentIntentId?: string;
    refundDetails?: {
      amount?: number;
      reason?: string;
      transactionId?: string;
    };
  };

  @Column({ type: 'timestamp', nullable: true })
  capturedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  settledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastStatusChangeAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  failureReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}