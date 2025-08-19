import { AppDataSource } from '../../config/database';
import { Anuncio } from './anuncio.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';
import { AnuncioStatus } from './anuncio.interfaces';
import { AnuncioSearchFilters, SearchResult } from '../../shared/interfaces/search-filters';
import { CursorPaginationHelper, CursorData, CursorPaginationResult } from '../../shared/utils/cursor-pagination.helper';

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

  async searchWithFilters(filters: AnuncioSearchFilters & { cursor?: string }): Promise<CursorPaginationResult<Anuncio>> {
    const { tenantId, cursor, limit: requestLimit, ...searchFilters } = filters;
    const limit = CursorPaginationHelper.validateLimit(requestLimit);

    const queryBuilder = this.repository
      .createQueryBuilder('anuncio')
      .leftJoinAndSelect('anuncio.property', 'property')
      .where('anuncio.tenantId = :tenantId', { tenantId });

    // Aplicar cursor si existe
    if (cursor) {
      const cursorData = CursorPaginationHelper.decodeCursor(cursor);
      CursorPaginationHelper.applyCursorCondition(queryBuilder, cursorData, 'anuncio');
    }

    // Filtros de anuncio
    if (searchFilters.status) {
      queryBuilder.andWhere('anuncio.status = :status', { status: searchFilters.status });
    }
    if (searchFilters.tipo) {
      queryBuilder.andWhere('anuncio.tipo = :tipo', { tipo: searchFilters.tipo });
    }
    if (searchFilters.propertyId) {
      queryBuilder.andWhere('anuncio.propertyId = :propertyId', { propertyId: searchFilters.propertyId });
    }
    if (searchFilters.minPrice) {
      queryBuilder.andWhere('anuncio.price >= :minPrice', { minPrice: searchFilters.minPrice });
    }
    if (searchFilters.maxPrice) {
      queryBuilder.andWhere('anuncio.price <= :maxPrice', { maxPrice: searchFilters.maxPrice });
    }

    // Filtros de propiedad
    if (searchFilters.propertyTipo) {
      queryBuilder.andWhere('property.tipo = :propertyTipo', { propertyTipo: searchFilters.propertyTipo });
    }
    if (searchFilters.propertyStatus) {
      queryBuilder.andWhere('property.status = :propertyStatus', { propertyStatus: searchFilters.propertyStatus });
    }
    if (searchFilters.pais) {
      queryBuilder.andWhere('property.pais = :pais', { pais: searchFilters.pais });
    }
    if (searchFilters.ciudad) {
      queryBuilder.andWhere('property.ciudad = :ciudad', { ciudad: searchFilters.ciudad });
    }
    if (searchFilters.minSuperficie) {
      queryBuilder.andWhere('property.superficie >= :minSuperficie', { minSuperficie: searchFilters.minSuperficie });
    }
    if (searchFilters.maxSuperficie) {
      queryBuilder.andWhere('property.superficie <= :maxSuperficie', { maxSuperficie: searchFilters.maxSuperficie });
    }
    if (searchFilters.ambientes) {
      queryBuilder.andWhere('property.ambientes = :ambientes', { ambientes: searchFilters.ambientes });
    }

    // Ordenamiento y paginación por cursor
    queryBuilder
      .orderBy('anuncio.createdAt', 'DESC')
      .addOrderBy('anuncio.id', 'DESC')
      .limit(limit + 1); // +1 para detectar si hay más resultados

    const data = await queryBuilder.getMany();
    return CursorPaginationHelper.buildResult(data, limit);
  }
}