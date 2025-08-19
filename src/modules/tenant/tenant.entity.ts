import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { Propiedad } from '../propiedad/propiedad.entity';
import { Anuncio } from '../anuncio/anuncio.entity';
import { Transaccion } from '../transaccion/transaccion.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;

  @OneToMany(() => Usuario, usuario => usuario.tenant)
  usuarios!: Usuario[];

  @OneToMany(() => Propiedad, propiedad => propiedad.tenant)
  propiedades!: Propiedad[];

  @OneToMany(() => Anuncio, anuncio => anuncio.tenant)
  anuncios!: Anuncio[];

  @OneToMany(() => Transaccion, transaccion => transaccion.tenant)
  transacciones!: Transaccion[];
}