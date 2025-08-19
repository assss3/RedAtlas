import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Usuario } from './usuario.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';

export class UsuarioRepository extends BaseRepositoryImpl<Usuario> {
  constructor() {
    super(AppDataSource.getRepository(Usuario));
  }

  async findByEmail(email: string, tenantId: string): Promise<Usuario | null> {
    return await this.repository.findOne({
      where: { email, tenantId }
    });
  }
}