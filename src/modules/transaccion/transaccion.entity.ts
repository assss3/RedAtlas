import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TransactionStatus } from './transaccion.interfaces';
import { Anuncio } from '../anuncio/anuncio.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('transacciones')
export class Transaccion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @ManyToOne(() => Tenant, tenant => tenant.transacciones, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'anuncio_id' })
  anuncioId!: string;

  @ManyToOne(() => Anuncio, anuncio => anuncio.transacciones)
  @JoinColumn({ name: 'anuncio_id' })
  anuncio!: Anuncio;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Usuario, usuario => usuario.transacciones)
  @JoinColumn({ name: 'user_id' })
  user!: Usuario;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDIENTE,
  })
  status!: TransactionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}