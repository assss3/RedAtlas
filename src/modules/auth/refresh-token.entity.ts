import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { Tenant } from '../tenant/tenant.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'user_id' })
  user!: Usuario;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column()
  token!: string;

  @Column({ name: 'expires_at' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}