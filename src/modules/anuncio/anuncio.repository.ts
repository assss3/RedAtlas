import { AppDataSource } from '../../config/database';
import { Anuncio } from './anuncio.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';
import { AnuncioStatus } from './anuncio.interfaces';

export class AnuncioRepository extends BaseRepositoryImpl<Anuncio> {
  constructor() {
    super(AppDataSource.getRepository(Anuncio));
  }

  async findByPropertyId(propertyId: string, tenantId: string): Promise<Anuncio[]> {
    return await this.repository.find({
      where: { tenantId, propertyId }, // tenant_id first for index optimization
      relations: ['property'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: AnuncioStatus, tenantId: string): Promise<Anuncio[]> {
    return await this.repository.find({
      where: { tenantId, status }, // tenant_id first for index optimization
      relations: ['property'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByTipo(tipo: string, tenantId: string): Promise<Anuncio[]> {
    return await this.repository.find({
      where: { tenantId, tipo: tipo as any }, // tenant_id first for index optimization
      relations: ['property'],
      order: { createdAt: 'DESC' }
    });
  }

  async updateStatusByPropertyId(propertyId: string, status: AnuncioStatus, tenantId: string): Promise<void> {
    await this.repository.update(
      { tenantId, propertyId }, // tenant_id first for index optimization
      { status }
    );
  }
}