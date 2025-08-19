import { Anuncio } from './anuncio.entity';
import { AnuncioRepository } from './anuncio.repository';
import { ValidationError, NotFoundError } from '../../core/errors';
import { AnuncioStatus } from './anuncio.interfaces';

export class AnuncioService {
  constructor(private anuncioRepository: AnuncioRepository) {}

  async create(data: Partial<Anuncio>): Promise<Anuncio> {
    return await this.anuncioRepository.create(data);
  }

  async findById(id: string, tenantId: string): Promise<Anuncio> {
    const anuncio = await this.anuncioRepository.findById(id, tenantId);
    if (!anuncio) {
      throw new NotFoundError('Anuncio');
    }
    return anuncio;
  }

  async findAll(tenantId: string): Promise<Anuncio[]> {
    return await this.anuncioRepository.findAll(tenantId);
  }

  async findByPropertyId(propertyId: string, tenantId: string): Promise<Anuncio[]> {
    return await this.anuncioRepository.findByPropertyId(propertyId, tenantId);
  }

  async update(id: string, data: Partial<Anuncio>, tenantId: string): Promise<Anuncio> {
    const anuncio = await this.anuncioRepository.update(id, data, tenantId);
    if (!anuncio) {
      throw new NotFoundError('Anuncio');
    }
    return anuncio;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const deleted = await this.anuncioRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Anuncio');
    }
  }

  async restore(id: string, tenantId: string): Promise<Anuncio> {
    const anuncio = await this.anuncioRepository.restore(id, tenantId);
    if (!anuncio) {
      throw new NotFoundError('Anuncio');
    }
    return anuncio;
  }

  async updateStatusByPropertyId(propertyId: string, status: AnuncioStatus, tenantId: string): Promise<void> {
    await this.anuncioRepository.updateStatusByPropertyId(propertyId, status, tenantId);
  }

  async findByStatus(status: AnuncioStatus, tenantId: string): Promise<Anuncio[]> {
    return await this.anuncioRepository.findByStatus(status, tenantId);
  }

  async findByTipo(tipo: string, tenantId: string): Promise<Anuncio[]> {
    return await this.anuncioRepository.findByTipo(tipo, tenantId);
  }
}