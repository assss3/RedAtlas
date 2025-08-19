import { AppDataSource } from '../../config/database';
import { Propiedad } from './propiedad.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';
import { CursorPaginationHelper, CursorPaginationResult } from '../../shared/utils/cursor-pagination.helper';
import { OrderValidationHelper, OrderParams } from '../../shared/utils/order-validation.helper';

export class PropiedadRepository extends BaseRepositoryImpl<Propiedad> {
  protected orderConfig = {
    allowedFields: ['createdAt', 'superficie', 'tipo'],
    defaultField: 'createdAt',
    defaultDirection: 'DESC' as const
  };

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

  async searchWithFilters(filters: {
    tenantId: string;
    cursor?: string;
    limit?: number;
    status?: string;
    tipo?: string;
    pais?: string;
    ciudad?: string;
    calle?: string;
    minSuperficie?: number;
    maxSuperficie?: number;
    ambientes?: number;
    title?: string;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<CursorPaginationResult<Propiedad>> {
    const { tenantId, cursor, limit: requestLimit, orderBy, orderDirection, ...searchFilters } = filters;
    const limit = CursorPaginationHelper.validateLimit(requestLimit);
    const { field, direction } = OrderValidationHelper.validateAndGetOrder({ orderBy, orderDirection }, this.orderConfig);

    const queryBuilder = this.repository
      .createQueryBuilder('propiedad')
      .where('propiedad.tenantId = :tenantId', { tenantId });

    if (cursor) {
      const cursorData = CursorPaginationHelper.decodeCursor(cursor);
      CursorPaginationHelper.applyCursorCondition(queryBuilder, cursorData, 'propiedad');
    }

    if (searchFilters.status) {
      queryBuilder.andWhere('propiedad.status = :status', { status: searchFilters.status });
    }
    if (searchFilters.tipo) {
      queryBuilder.andWhere('propiedad.tipo = :tipo', { tipo: searchFilters.tipo });
    }
    if (searchFilters.pais) {
      queryBuilder.andWhere('propiedad.pais = :pais', { pais: searchFilters.pais });
    }
    if (searchFilters.ciudad) {
      queryBuilder.andWhere('propiedad.ciudad = :ciudad', { ciudad: searchFilters.ciudad });
    }
    if (searchFilters.calle) {
      queryBuilder.andWhere('propiedad.calle ILIKE :calle', { calle: `%${searchFilters.calle}%` });
    }
    if (searchFilters.title) {
      queryBuilder.andWhere('propiedad.title ILIKE :title', { title: `%${searchFilters.title}%` });
    }
    if (searchFilters.minSuperficie) {
      queryBuilder.andWhere('propiedad.superficie >= :minSuperficie', { minSuperficie: searchFilters.minSuperficie });
    }
    if (searchFilters.maxSuperficie) {
      queryBuilder.andWhere('propiedad.superficie <= :maxSuperficie', { maxSuperficie: searchFilters.maxSuperficie });
    }
    if (searchFilters.ambientes) {
      queryBuilder.andWhere('propiedad.ambientes = :ambientes', { ambientes: searchFilters.ambientes });
    }

    queryBuilder
      .orderBy(`propiedad.${field}`, direction)
      .addOrderBy('propiedad.id', 'DESC')
      .limit(limit + 1);

    const data = await queryBuilder.getMany();
    return CursorPaginationHelper.buildResult(data, limit);
  }
}