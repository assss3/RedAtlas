import { AppDataSource } from '../../config/database';
import { Propiedad } from './propiedad.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';

export class PropiedadRepository extends BaseRepositoryImpl<Propiedad> {
  constructor() {
    super(AppDataSource.getRepository(Propiedad));
  }

  async create(data: Partial<Propiedad>): Promise<Propiedad> {
    if (data.location && data.location.startsWith('POINT(')) {
      // Usar query raw para insertar correctamente la geometría
      const result = await this.repository.query(
        `INSERT INTO propiedades (tenant_id, title, price, location) 
         VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromText($4), 4326)::geography) 
         RETURNING *`,
        [data.tenantId, data.title, data.price, data.location]
      );
      return result[0];
    }
    return super.create(data);
  }
}