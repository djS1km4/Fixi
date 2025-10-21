import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Entity,
  Index,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'deleted_at',
  })
  deletedAt?: Date;
}