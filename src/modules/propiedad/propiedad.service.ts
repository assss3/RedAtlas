import { Propiedad } from './propiedad.entity';
import { PropiedadRepository } from './propiedad.repository';
import { ValidationError, NotFoundError } from '../../core/errors';
import { PropiedadStatus } from './propiedad.interfaces';
import { CursorPaginationResult } from '../../shared/utils/cursor-pagination.helper';
import { CacheService } from '../../shared/services/cache.service';

export class PropiedadService {
  constructor(
    private propiedadRepository: PropiedadRepository,
    private cacheService: CacheService = CacheService.getInstance()
  ) {}

  async create(data: Partial<Propiedad>): Promise<Propiedad> {
    const propiedad = await this.propiedadRepository.create(data);
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('property', data.tenantId!);
    
    return propiedad;
  }

  async findById(id: string, tenantId: string): Promise<Propiedad> {
    const cacheKey = `property:${tenantId}:${id}`;
    
    return await this.cacheService.getOrSet(
      cacheKey,
      600, // 10 minutos
      async () => {
        const propiedad = await this.propiedadRepository.findById(id, tenantId);
        if (!propiedad) {
          throw new NotFoundError('Propiedad');
        }
        return propiedad;
      }
    );
  }

  async findAll(tenantId: string, cursor?: string, limit?: number): Promise<CursorPaginationResult<Propiedad>> {
    return await this.propiedadRepository.findAll(tenantId, cursor, limit);
  }

  async update(id: string, data: Partial<Propiedad>, tenantId: string): Promise<Propiedad> {
    const propiedad = await this.propiedadRepository.update(id, data, tenantId);
    if (!propiedad) {
      throw new NotFoundError('Propiedad');
    }
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('property', tenantId, id);
    
    return propiedad;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const deleted = await this.propiedadRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Propiedad');
    }
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('property', tenantId, id);
  }

  async restore(id: string, tenantId: string): Promise<Propiedad> {
    const propiedad = await this.propiedadRepository.restore(id, tenantId);
    if (!propiedad) {
      throw new NotFoundError('Propiedad');
    }
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('property', tenantId, id);
    
    return propiedad;
  }

  async updateStatus(id: string, status: PropiedadStatus, tenantId: string): Promise<void> {
    await this.propiedadRepository.update(id, { status }, tenantId);
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('property', tenantId, id);
  }

  async findByStatus(status: string, tenantId: string): Promise<Propiedad[]> {
    return await this.propiedadRepository.findByStatus(status, tenantId);
  }

  async findByTipo(tipo: string, tenantId: string): Promise<Propiedad[]> {
    return await this.propiedadRepository.findByTipo(tipo, tenantId);
  }

  async findByLocation(pais: string, ciudad: string, tenantId: string): Promise<Propiedad[]> {
    return await this.propiedadRepository.findByLocation(pais, ciudad, tenantId);
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
  }): Promise<CursorPaginationResult<Propiedad>> {
    const cacheKey = this.cacheService.generateKey('properties_search', filters.tenantId, filters);
    
    return await this.cacheService.getOrSet(
      cacheKey,
      300, // 5 minutos
      async () => {
        return await this.propiedadRepository.searchWithFilters(filters);
      }
    );
  }
}