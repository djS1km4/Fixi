import {
  Entity,
  Column,
  Index,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole, UserStatus, VerificationStatus } from '../enums/user-role.enum';
import { ServiceEntity } from '../../services/entities/service.entity';
import { OrderEntity } from '../../orders/entities/order.entity';
import { ReviewEntity } from '../../reviews/entities/review.entity';

@Entity('users')
@Index('idx_users_email')
@Index('idx_users_role')
@Index('idx_users_is_verified')
export class UserEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  documentType?: string; // CC, CE, PPT

  @Column({ type: 'varchar', length: 20, nullable: true })
  documentNumber?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.NOT_VERIFIED
  })
  isVerified: VerificationStatus;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: number;

  @Column({ type: 'jsonb', nullable: true })
  specialties?: string[]; // Array de especialidades para técnicos

  @Column({ type: 'jsonb', nullable: true })
  workAreas?: string[]; // Áreas de cobertura (localidades de Bogotá)

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  rating?: number; // Calificación promedio

  @Column({ type: 'int', default: 0 })
  completedJobs: number;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  phoneVerifiedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  documentsVerifiedAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rutNumber?: string; // Número de RUT para facturación DIAN

  @Column({ type: 'jsonb', nullable: true })
  bankInfo?: {
    bankName?: string;
    accountNumber?: string;
    accountType?: string;
    accountHolder?: string;
  };

  // Relaciones
  @OneToMany(() => ServiceEntity, service => service.technician)
  services?: ServiceEntity[];

  @OneToMany(() => OrderEntity, order => order.customer)
  customerOrders?: OrderEntity[];

  @OneToMany(() => OrderEntity, order => order.technician)
  technicianOrders?: OrderEntity[];

  @OneToMany(() => ReviewEntity, review => review.technician)
  technicianReviews?: ReviewEntity[];

  @OneToMany(() => ReviewEntity, review => review.customer)
  customerReviews?: ReviewEntity[];

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}