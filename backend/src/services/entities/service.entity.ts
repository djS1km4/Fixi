import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { ServiceCategory } from '../../common/enums/service-category.enum';
import { UserEntity } from '../../common/entities/user.entity';
import { OrderEntity } from '../../orders/entities/order.entity';

@Entity('services')
@Index('idx_services_technician')
@Index('idx_services_category')
@Index('idx_services_active')
export class ServiceEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ServiceCategory
  })
  category: ServiceCategory;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  averagePrice: number;

  @Column({ type: 'integer', nullable: true })
  estimatedDuration: number; // in minutes

  @Column({ type: 'jsonb', nullable: true })
  deviceTypes?: string[];

  @Column({ type: 'jsonb', nullable: true })
  issuesHandled?: string[];

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  requirements?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

  @Column({ type: 'jsonb', nullable: true })
  toolsRequired?: string[];

  @Column({ type: 'text', nullable: true })
  processDescription?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'integer', default: 0 })
  popularityScore: number;

  @Column({ type: 'integer', default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'jsonb', nullable: true })
  workAreas?: string[]; // Localidades de Bogotá donde se ofrece el servicio

  @Column({ type: 'jsonb', nullable: true })
  serviceTags?: string[];

  // Relaciones
  @ManyToOne(() => UserEntity, technician => technician.services)
  @JoinColumn({ name: 'technician_id' })
  technician: UserEntity;

  @OneToMany(() => OrderEntity, order => order.service)
  orders?: OrderEntity[];

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}