import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Propiedad } from '../propiedad/propiedad.entity';
import { Transaccion } from '../transaccion/transaccion.entity';
import { OperationType, AnuncioStatus } from '../../core/interfaces';

@Entity('anuncios')
export class Anuncio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ name: 'property_id' })
  propertyId!: string;

  @ManyToOne(() => Propiedad, propiedad => propiedad.anuncios)
  @JoinColumn({ name: 'property_id' })
  property!: Propiedad;

  @Column('text')
  description!: string;

  @Column({ type: 'enum', enum: OperationType })
  tipo!: OperationType;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'enum', enum: AnuncioStatus, default: AnuncioStatus.ACTIVO })
  status!: AnuncioStatus;

  @OneToMany(() => Transaccion, transaccion => transaccion.anuncio)
  transacciones!: Transaccion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}