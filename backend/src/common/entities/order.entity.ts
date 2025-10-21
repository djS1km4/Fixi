import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { PaymentEntity } from './payment.entity';
import { MessageEntity } from './message.entity';
import { ReviewEntity } from './review.entity';
import { OrderStatus } from '../enums/order-status.enum';

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  customerNotes?: string;

  @Column({ type: 'jsonb', nullable: true })
  serviceDetails?: {
    serviceType?: string;
    deviceType?: string;
    issues?: string[];
    estimatedDuration?: number;
  };

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  estimatedPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  finalPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  platformFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  technicianAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  @Column({ type: 'timestamp', nullable: true })
  paidAt?: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerAddress?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerLocation?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };

  @Column({ type: 'text', nullable: true })
  technicianNotes?: string;

  @Column({ type: 'jsonb', nullable: true })
  workPerformed?: {
    actions?: string[];
    partsUsed?: string[];
    timeSpent?: number;
  };

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  customerRating?: number;

  @Column({ type: 'text', nullable: true })
  customerReview?: string;

  @Column({ type: 'timestamp', nullable: true })
  customerRatedAt?: Date;

  // Relaciones
  @ManyToOne(() => UserEntity, customer => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer: UserEntity;

  @ManyToOne(() => UserEntity, technician => technician.orders)
  @JoinColumn({ name: 'technician_id' })
  technician: UserEntity;

  @OneToMany(() => MessageEntity, message => message.order)
  messages?: MessageEntity[];

  @OneToMany(() => ReviewEntity, review => review.order)
  reviews?: ReviewEntity[];

  @OneToMany(() => PaymentEntity, payment => payment.order)
  payments?: PaymentEntity[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  stripePaymentIntentId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  paypalPaymentId?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastStatusChangeAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cancellationReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  resolutionDetails?: {
    refundAmount?: number;
    refundReason?: string;
    newOrderCreated?: boolean;
    newOrderId?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}