import { Anuncio } from './anuncio.entity';
import { AnuncioRepository } from './anuncio.repository';
import { ValidationError, NotFoundError } from '../../core/errors';
import { AnuncioStatus } from './anuncio.interfaces';
import { AnuncioSearchFilters } from '../../shared/interfaces/search-filters';
import { CursorPaginationResult } from '../../shared/utils/cursor-pagination.helper';
import { CacheService } from '../../shared/services/cache.service';
import { LockService } from '../../shared/services/lock.service';
import { PropiedadStatus } from '../propiedad/propiedad.interfaces';
import { PropiedadService } from '../propiedad/propiedad.service';

export class AnuncioService {
  constructor(
    private anuncioRepository: AnuncioRepository,
    private propiedadService: PropiedadService,
    private cacheService: CacheService = CacheService.getInstance(),
    private lockService: LockService = LockService.getInstance()
  ) {}

  async create(data: Partial<Anuncio>): Promise<Anuncio> {
    const lockKey = `create_listing_lock:${data.tenantId}:${data.propertyId}`;
    
    return await this.lockService.withLock(lockKey, 15, async () => {
      // Verificar que la propiedad esté disponible
      const propiedad = await this.propiedadService.findById(data.propertyId!, data.tenantId!);
      
      if (propiedad.status !== PropiedadStatus.DISPONIBLE) {
        throw new ValidationError(`No se puede crear anuncio. La propiedad está en estado: ${propiedad.status}`);
      }
      
      // Verificar que la propiedad no tenga anuncios activos del mismo tipo
      const existingListings = await this.anuncioRepository.findByPropertyId(data.propertyId!, data.tenantId!);
      const activeOfSameType = existingListings.find(a => a.tipo === data.tipo && a.status === AnuncioStatus.ACTIVO);
      
      if (activeOfSameType) {
        throw new ValidationError(`Ya existe un anuncio activo de ${data.tipo} para esta propiedad`);
      }
      
      const anuncio = await this.anuncioRepository.create(data);
      
      // Invalidar cache
      await this.cacheService.invalidateEntity('listing', data.tenantId!);
      
      return anuncio;
    });
  }

  async findById(id: string, tenantId: string): Promise<Anuncio> {
    const cacheKey = `listing:${tenantId}:${id}`;
    
    return await this.cacheService.getOrSet(
      cacheKey,
      300, // 5 minutos
      async () => {
        const anuncio = await this.anuncioRepository.findById(id, tenantId);
        if (!anuncio) {
          throw new NotFoundError('Anuncio');
        }
        return anuncio;
      }
    );
  }



  async findByPropertyId(propertyId: string, tenantId: string): Promise<Anuncio[]> {
    return await this.anuncioRepository.findByPropertyId(propertyId, tenantId);
  }

  async update(id: string, data: Partial<Anuncio>, tenantId: string): Promise<Anuncio> {
    // Si se actualiza precio o status, usar lock
    if (data.price !== undefined || data.status !== undefined) {
      const lockKey = `update_listing_lock:${tenantId}:${id}`;
      
      return await this.lockService.withLock(lockKey, 10, async () => {
        const anuncio = await this.anuncioRepository.update(id, data, tenantId);
        if (!anuncio) {
          throw new NotFoundError('Anuncio');
        }
        
        // Invalidar cache
        await this.cacheService.invalidateEntity('listing', tenantId, id);
        
        return anuncio;
      });
    }
    
    // Para otros campos, actualizar sin lock
    const anuncio = await this.anuncioRepository.update(id, data, tenantId);
    if (!anuncio) {
      throw new NotFoundError('Anuncio');
    }
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('listing', tenantId, id);
    
    return anuncio;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const deleted = await this.anuncioRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Anuncio');
    }
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('listing', tenantId, id);
  }

  async restore(id: string, tenantId: string): Promise<Anuncio> {
    const anuncio = await this.anuncioRepository.restore(id, tenantId);
    if (!anuncio) {
      throw new NotFoundError('Anuncio');
    }
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('listing', tenantId, id);
    
    return anuncio;
  }

  async updateStatusByPropertyId(propertyId: string, status: AnuncioStatus, tenantId: string): Promise<void> {
    const lockKey = `property_status_lock:${tenantId}:${propertyId}`;
    
    await this.lockService.withLock(lockKey, 10, async () => {
      await this.anuncioRepository.updateStatusByPropertyId(propertyId, status, tenantId);
      // Invalidar cache después de la actualización
      await this.cacheService.invalidateEntity('listing', tenantId);
    });
  }

  async findByStatus(status: AnuncioStatus, tenantId: string): Promise<Anuncio[]> {
    return await this.anuncioRepository.findByStatus(status, tenantId);
  }

  async findByTipo(tipo: string, tenantId: string): Promise<Anuncio[]> {
    return await this.anuncioRepository.findByTipo(tipo, tenantId);
  }

  async searchWithPropertiesFilters(filters: AnuncioSearchFilters & { cursor?: string }): Promise<CursorPaginationResult<Anuncio>> {
    const cacheKey = this.cacheService.generateKey('listings_search', filters.tenantId, filters);
    
    return await this.cacheService.getOrSet(
      cacheKey,
      120, // 2 minutos
      async () => {
        return await this.anuncioRepository.searchWithPropertiesFilters(filters);
      }
    );
  }

  async searchWithFilters(filters: {
    tenantId: string;
    cursor?: string;
    limit?: number;
    status?: string;
    tipo?: string;
    propertyId?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<CursorPaginationResult<Anuncio>> {
    const cacheKey = this.cacheService.generateKey('anuncios_search', filters.tenantId, filters);
    
    return await this.cacheService.getOrSet(
      cacheKey,
      120, // 2 minutos
      async () => {
        return await this.anuncioRepository.searchWithFilters(filters);
      }
    );
  }
}