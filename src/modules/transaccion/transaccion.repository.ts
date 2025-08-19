import { AppDataSource } from '../../config/database';
import { Transaccion } from './transaccion.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';

export class TransaccionRepository extends BaseRepositoryImpl<Transaccion> {
  constructor() {
    super(AppDataSource.getRepository(Transaccion));
  }

  async findByUserId(userId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { tenantId, userId }, // tenant_id first for index optimization
      relations: ['anuncio', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByAnuncioId(anuncioId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { tenantId, anuncioId }, // tenant_id first for index optimization
      relations: ['anuncio', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { tenantId, status: status as any }, // tenant_id first for index optimization
      relations: ['anuncio', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findPendingByAnuncioId(anuncioId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { tenantId, anuncioId, status: 'PENDIENTE' as any }, // tenant_id first for index optimization
      relations: ['anuncio', 'user'],
      order: { createdAt: 'DESC' }
    });
  }
}