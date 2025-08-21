import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ImportStatus } from './import.interfaces';
import { Tenant } from '../tenant/tenant.entity';
import { Usuario } from '../usuario/usuario.entity';

@Entity('import_jobs')
export class ImportJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Usuario, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: Usuario;

  @Column({ name: 'idempotency_key', unique: true, nullable: true })
  idempotencyKey?: string;

  @Column()
  filename!: string;

  @Column({ type: 'enum', enum: ImportStatus, default: ImportStatus.PENDING })
  status!: ImportStatus;

  @Column({ name: 'total_rows', default: 0 })
  totalRows!: number;

  @Column({ name: 'processed_rows', default: 0 })
  processedRows!: number;

  @Column({ name: 'success_rows', default: 0 })
  successRows!: number;

  @Column({ name: 'error_rows', default: 0 })
  errorRows!: number;

  @Column({ type: 'jsonb', default: '[]' })
  errors!: any[];

  @Column({ name: 'file_hash', nullable: true })
  fileHash?: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}