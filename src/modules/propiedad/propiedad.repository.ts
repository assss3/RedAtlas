import { AppDataSource } from '../../config/database';
import { Propiedad } from './propiedad.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';

export class PropiedadRepository extends BaseRepositoryImpl<Propiedad> {
  constructor() {
    super(AppDataSource.getRepository(Propiedad));
  }

  async create(data: Partial<Propiedad>): Promise<Propiedad> {
    if (data.location && typeof data.location === 'string' && data.location.startsWith('POINT(')) {
      const result = await this.repository.query(
        `INSERT INTO propiedades (tenant_id, title, tipo, superficie, pais, ciudad, calle, altura, ambientes, location) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, ST_SetSRID(ST_GeomFromText($10), 4326)::geography) 
         RETURNING *`,
        [data.tenantId, data.title, data.tipo, data.superficie, data.pais, data.ciudad, data.calle, data.altura, data.ambientes, data.location]
      );
      return result[0];
    }
    return super.create(data);
  }

  async findByStatus(status: string, tenantId: string): Promise<Propiedad[]> {
    return await this.repository.find({
      where: { tenantId, status: status as any }, // tenant_id first for index optimization
      order: { createdAt: 'DESC' }
    });
  }

  async findByTipo(tipo: string, tenantId: string): Promise<Propiedad[]> {
    return await this.repository.find({
      where: { tenantId, tipo: tipo as any }, // tenant_id first for index optimization
      order: { createdAt: 'DESC' }
    });
  }

  async findByLocation(pais: string, ciudad: string, tenantId: string): Promise<Propiedad[]> {
    return await this.repository.find({
      where: { tenantId, pais, ciudad }, // tenant_id first for index optimization
      order: { createdAt: 'DESC' }
    });
  }
}