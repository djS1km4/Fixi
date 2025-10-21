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

export enum TransactionType {
  CHARGE = 'CHARGE',
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK',
  FEE = 'FEE',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('payment_transactions')
@Index(['paymentId'])
@Index(['type'])
@Index(['status'])
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id', type: 'uuid' })
  paymentId: string;

  @ManyToOne(() => Payment, payment => payment.transactions)
  payment: Payment;

  @Column({
    type: 'enum',
    enum: TransactionType,
    comment: 'Tipo de transacción'
  })
  type: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
    comment: 'Estado de la transacción'
  })
  status: TransactionStatus;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    comment: 'Monto de la transacción en COP'
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    comment: 'Comisión de la transacción en COP'
  })
  fee: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID de transacción externa del procesador'
  })
  externalTransactionId: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Proveedor de pago (wompi, mercadopago, etc.)'
  })
  provider: string | null;

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
    comment: 'Código de referencia de la transacción'
  })
  referenceCode: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Notas sobre la transacción'
  })
  notes: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    comment: 'Fecha de creación de la transacción'
  })
  createdAt: Date;
}