import { AppDataSource } from '../../config/database';
import { Transaccion } from './transaccion.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';

export class TransaccionRepository extends BaseRepositoryImpl<Transaccion> {
  constructor() {
    super(AppDataSource.getRepository(Transaccion));
  }

  async findByUserId(userId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { userId, tenantId },
      relations: ['anuncio', 'user']
    });
  }

  async findByAnuncioId(anuncioId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { anuncioId, tenantId },
      relations: ['anuncio', 'user']
    });
  }
}