import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Anuncio } from '../anuncio/anuncio.entity';
@Entity('propiedades')
export class Propiedad {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column()
  title!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

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

  @OneToMany(() => Anuncio, anuncio => anuncio.property)
  anuncios!: Anuncio[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date;
}