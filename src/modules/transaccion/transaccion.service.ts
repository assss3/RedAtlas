import { Transaccion } from './transaccion.entity';
import { TransaccionRepository } from './transaccion.repository';
import { ValidationError, NotFoundError } from '../../core/errors';

export class TransaccionService {
  constructor(private transaccionRepository: TransaccionRepository) {}

  async create(data: Partial<Transaccion>): Promise<Transaccion> {
    return await this.transaccionRepository.create(data);
  }

  async findById(id: string, tenantId: string): Promise<Transaccion> {
    const transaccion = await this.transaccionRepository.findById(id, tenantId);
    if (!transaccion) {
      throw new NotFoundError('Transacción');
    }
    return transaccion;
  }

  async findAll(tenantId: string): Promise<Transaccion[]> {
    return await this.transaccionRepository.findAll(tenantId);
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
    return transaccion;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const deleted = await this.transaccionRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Transacción');
    }
  }

  async restore(id: string, tenantId: string): Promise<Transaccion> {
    const transaccion = await this.transaccionRepository.restore(id, tenantId);
    if (!transaccion) {
      throw new NotFoundError('Transacción');
    }
    return transaccion;
  }
}