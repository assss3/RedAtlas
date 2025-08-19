import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { UserRole } from './usuario.interfaces';
import { Transaccion } from '../transaccion/transaccion.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @ManyToOne(() => Tenant, tenant => tenant.usuarios, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column()
  nombre!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash' })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  rol!: UserRole;

  @OneToMany(() => Transaccion, transaccion => transaccion.user)
  transacciones!: Transaccion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}