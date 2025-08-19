import { Propiedad } from './propiedad.entity';
import { PropiedadRepository } from './propiedad.repository';
import { ValidationError, NotFoundError } from '../../core/errors';
import { PropiedadStatus } from './propiedad.interfaces';

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

  async findAll(tenantId: string): Promise<Propiedad[]> {
    return await this.propiedadRepository.findAll(tenantId);
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
}