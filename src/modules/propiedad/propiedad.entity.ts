import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Anuncio } from '../anuncio/anuncio.entity';
import { PropertyType, PropiedadStatus } from './propiedad.interfaces';
import { Tenant } from '../tenant/tenant.entity';
@Entity('propiedades')
export class Propiedad {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @ManyToOne(() => Tenant, tenant => tenant.propiedades, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column()
  title!: string;

  @Column({ type: 'enum', enum: PropertyType })
  tipo!: PropertyType;

  @Column({ nullable: true })
  ambientes!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  superficie!: number;

  @Column()
  pais!: string;

  @Column()
  ciudad!: string;

  @Column()
  calle!: string;

  @Column()
  altura!: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    transformer: {
      to: (value: string) => {
        if (!value) return null;
        // Si ya es un POINT, lo devuelve tal como está
        if (value.startsWith('POINT(')) {
          return value;
        }
        return value;
      },
      from: (value: any) => value
    }
  })
  location!: string;

  @Column({ type: 'enum', enum: PropiedadStatus, default: PropiedadStatus.DISPONIBLE })
  status!: PropiedadStatus;

  @OneToMany(() => Anuncio, anuncio => anuncio.property)
  anuncios!: Anuncio[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}