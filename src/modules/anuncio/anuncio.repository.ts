import { AppDataSource } from '../../config/database';
import { Anuncio } from './anuncio.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';
import { AnuncioStatus } from './anuncio.interfaces';
import { AnuncioSearchFilters, SearchResult } from '../../shared/interfaces/search-filters';

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

  async searchWithFilters(filters: AnuncioSearchFilters): Promise<SearchResult<Anuncio>> {
    const { page = 1, limit = 10, tenantId, ...searchFilters } = filters;
    const offset = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('anuncio')
      .leftJoinAndSelect('anuncio.property', 'property')
      .where('anuncio.tenantId = :tenantId', { tenantId }); // tenant_id first for index optimization

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

    // Ordenamiento y paginación
    queryBuilder
      .orderBy('anuncio.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}