import { Propiedad } from './propiedad.entity';
import { PropiedadRepository } from './propiedad.repository';
import { ValidationError, NotFoundError } from '../../core/errors';
import { PropiedadStatus } from './propiedad.interfaces';
import { CursorPaginationResult } from '../../shared/utils/cursor-pagination.helper';

export class PropiedadService {
  constructor(private propiedadRepository: PropiedadRepository) {}

  async create(data: Partial<Propiedad>): Promise<Propiedad> {
    return await this.propiedadRepository.create(data);
  }

  async findById(id: string, tenantId: string): Promise<Propiedad> {
    const propiedad = await this.propiedadRepository.findById(id, tenantId);
    if (!propiedad) {
      throw new NotFoundError('Propiedad');
    }
    return propiedad;
  }

  async findAll(tenantId: string, cursor?: string, limit?: number): Promise<CursorPaginationResult<Propiedad>> {
    return await this.propiedadRepository.findAll(tenantId, cursor, limit);
  }

  async update(id: string, data: Partial<Propiedad>, tenantId: string): Promise<Propiedad> {
    const propiedad = await this.propiedadRepository.update(id, data, tenantId);
    if (!propiedad) {
      throw new NotFoundError('Propiedad');
    }
    return propiedad;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const deleted = await this.propiedadRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Propiedad');
    }
  }

  async restore(id: string, tenantId: string): Promise<Propiedad> {
    const propiedad = await this.propiedadRepository.restore(id, tenantId);
    if (!propiedad) {
      throw new NotFoundError('Propiedad');
    }
    return propiedad;
  }

  async updateStatus(id: string, status: PropiedadStatus, tenantId: string): Promise<void> {
    await this.propiedadRepository.update(id, { status }, tenantId);
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
    minSuperficie?: number;
    maxSuperficie?: number;
    ambientes?: number;
  }): Promise<CursorPaginationResult<Propiedad>> {
    return await this.propiedadRepository.searchWithFilters(filters);
  }
}