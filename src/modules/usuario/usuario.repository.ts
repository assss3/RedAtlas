import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Usuario } from './usuario.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';

export class UsuarioRepository extends BaseRepositoryImpl<Usuario> {
  protected orderConfig = {
    allowedFields: ['createdAt'],
    defaultField: 'createdAt',
    defaultDirection: 'DESC' as const
  };

  constructor() {
    super(AppDataSource.getRepository(Usuario));
  }

  async findByEmail(email: string, tenantId: string): Promise<Usuario | null> {
    return await this.repository.findOne({
      where: { tenantId, email } // tenant_id first for index optimization
    });
  }

  async findByRole(role: string, tenantId: string): Promise<Usuario[]> {
    return await this.repository.find({
      where: { tenantId, rol: role as any },
      order: { createdAt: 'DESC' }
    });
  }
}