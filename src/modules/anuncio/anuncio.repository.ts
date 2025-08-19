import { AppDataSource } from '../../config/database';
import { Anuncio } from './anuncio.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';

export class AnuncioRepository extends BaseRepositoryImpl<Anuncio> {
  constructor() {
    super(AppDataSource.getRepository(Anuncio));
  }

  async findByPropertyId(propertyId: string, tenantId: string): Promise<Anuncio[]> {
    return await this.repository.find({
      where: { propertyId, tenantId },
      relations: ['property']
    });
  }
}