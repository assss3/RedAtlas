import { Transaccion } from './transaccion.entity';
import { TransaccionRepository } from './transaccion.repository';
import { ValidationError, NotFoundError } from '../../core/errors';
import { TransactionStatus } from './transaccion.interfaces';
import { AnuncioService } from '../anuncio/anuncio.service';
import { PropiedadService } from '../propiedad/propiedad.service';
import { AnuncioStatus } from '../anuncio/anuncio.interfaces';
import { PropiedadStatus } from '../propiedad/propiedad.interfaces';
import { CursorPaginationResult } from '../../shared/utils/cursor-pagination.helper';
import { CacheService } from '../../shared/services/cache.service';

export class TransaccionService {
  constructor(
    private transaccionRepository: TransaccionRepository,
    private anuncioService: AnuncioService,
    private propiedadService: PropiedadService,
    private cacheService: CacheService = CacheService.getInstance()
  ) {}

  async create(data: Partial<Transaccion>): Promise<Transaccion> {
    // Crear transacción con estado pendiente
    const transaccionData = {
      ...data,
      status: TransactionStatus.PENDIENTE
    };

    
    const transaccion = await this.transaccionRepository.create(transaccionData);
    
    // Obtener el anuncio para acceder a la propiedad
    const anuncio = await this.anuncioService.findById(transaccion.anuncioId, transaccion.tenantId);
    
    // Cambiar todos los anuncios activos de la propiedad a reservado
    await this.anuncioService.updateStatusByPropertyId(
      anuncio.propertyId, 
      AnuncioStatus.RESERVADO, 
      transaccion.tenantId
    );
    
    // Cambiar propiedad a no disponible
    await this.propiedadService.updateStatus(
      anuncio.propertyId, 
      PropiedadStatus.NO_DISPONIBLE, 
      transaccion.tenantId
    );
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('transaction', transaccion.tenantId);
    
    return transaccion;
  }

  async findById(id: string, tenantId: string): Promise<Transaccion> {
    const cacheKey = `transaction:${tenantId}:${id}`;
    
    return await this.cacheService.getOrSet(
      cacheKey,
      180, // 3 minutos
      async () => {
        const transaccion = await this.transaccionRepository.findById(id, tenantId);
        if (!transaccion) {
          throw new NotFoundError('Transacción');
        }
        return transaccion;
      }
    );
  }



  async findByUserId(userId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.transaccionRepository.findByUserId(userId, tenantId);
  }

  async findByAnuncioId(anuncioId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.transaccionRepository.findByAnuncioId(anuncioId, tenantId);
  }

  async update(id: string, data: Partial<Transaccion>, tenantId: string): Promise<Transaccion> {
    const transaccion = await this.transaccionRepository.update(id, data, tenantId);
    if (!transaccion) {
      throw new NotFoundError('Transacción');
    }
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('transaction', tenantId, id);
    
    return transaccion;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const deleted = await this.transaccionRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Transacción');
    }
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('transaction', tenantId, id);
  }

  async restore(id: string, tenantId: string): Promise<Transaccion> {
    const transaccion = await this.transaccionRepository.restore(id, tenantId);
    if (!transaccion) {
      throw new NotFoundError('Transacción');
    }
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('transaction', tenantId, id);
    
    return transaccion;
  }

  async cancel(id: string, tenantId: string): Promise<Transaccion> {
    const transaccion = await this.findById(id, tenantId);
    
    // Actualizar estado de transacción
    const updatedTransaccion = await this.transaccionRepository.update(
      id, 
      { status: TransactionStatus.CANCELADA }, 
      tenantId
    );
    
    // Obtener el anuncio para acceder a la propiedad
    const anuncio = await this.anuncioService.findById(transaccion.anuncioId, tenantId);
    
    // Cambiar todos los anuncios de la propiedad a activo
    await this.anuncioService.updateStatusByPropertyId(
      anuncio.propertyId, 
      AnuncioStatus.ACTIVO, 
      tenantId
    );
    
    // Cambiar propiedad a disponible
    await this.propiedadService.updateStatus(
      anuncio.propertyId, 
      PropiedadStatus.DISPONIBLE, 
      tenantId
    );
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('transaction', tenantId, id);
    
    return updatedTransaccion!;
  }

  async complete(id: string, tenantId: string): Promise<Transaccion> {
    const transaccion = await this.findById(id, tenantId);
    
    // Actualizar estado de transacción
    const updatedTransaccion = await this.transaccionRepository.update(
      id, 
      { status: TransactionStatus.COMPLETADA }, 
      tenantId
    );
    
    // Obtener el anuncio para acceder a la propiedad
    const anuncio = await this.anuncioService.findById(transaccion.anuncioId, tenantId);
    
    // Cambiar todos los anuncios de la propiedad a inactivo
    await this.anuncioService.updateStatusByPropertyId(
      anuncio.propertyId, 
      AnuncioStatus.INACTIVO, 
      tenantId
    );
    
    // La propiedad permanece no disponible
    
    // Invalidar cache
    await this.cacheService.invalidateEntity('transaction', tenantId, id);
    
    return updatedTransaccion!;
  }

  async findByStatus(status: string, tenantId: string): Promise<Transaccion[]> {
    return await this.transaccionRepository.findByStatus(status, tenantId);
  }

  async findPendingByAnuncioId(anuncioId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.transaccionRepository.findPendingByAnuncioId(anuncioId, tenantId);
  }

  async searchWithFilters(filters: {
    tenantId: string;
    cursor?: string;
    limit?: number;
    status?: string;
    userId?: string;
    anuncioId?: string;
    minAmount?: number;
    maxAmount?: number;
  }): Promise<CursorPaginationResult<Transaccion>> {
    const cacheKey = this.cacheService.generateKey('transactions_search', filters.tenantId, filters);
    
    return await this.cacheService.getOrSet(
      cacheKey,
      30, // 30 segundos
      async () => {
        return await this.transaccionRepository.searchWithFilters(filters);
      }
    );
  }
}