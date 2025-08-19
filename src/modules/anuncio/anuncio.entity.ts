import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Propiedad } from '../propiedad/propiedad.entity';
import { Transaccion } from '../transaccion/transaccion.entity';

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

  @OneToMany(() => Transaccion, transaccion => transaccion.anuncio)
  transacciones!: Transaccion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}