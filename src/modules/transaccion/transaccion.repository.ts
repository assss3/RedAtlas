import { AppDataSource } from '../../config/database';
import { Transaccion } from './transaccion.entity';
import { BaseRepositoryImpl } from '../../shared/db/base.repository';
import { CursorPaginationHelper, CursorPaginationResult } from '../../shared/utils/cursor-pagination.helper';

export class TransaccionRepository extends BaseRepositoryImpl<Transaccion> {
  constructor() {
    super(AppDataSource.getRepository(Transaccion));
  }

  async findByUserId(userId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { tenantId, userId }, // tenant_id first for index optimization
      relations: ['anuncio', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByAnuncioId(anuncioId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { tenantId, anuncioId }, // tenant_id first for index optimization
      relations: ['anuncio', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { tenantId, status: status as any }, // tenant_id first for index optimization
      relations: ['anuncio', 'user'],
      order: { createdAt: 'DESC' }
    });
  }

  async findPendingByAnuncioId(anuncioId: string, tenantId: string): Promise<Transaccion[]> {
    return await this.repository.find({
      where: { tenantId, anuncioId, status: 'PENDIENTE' as any }, // tenant_id first for index optimization
      relations: ['anuncio', 'user'],
      order: { createdAt: 'DESC' }
    });
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
    const { tenantId, cursor, limit: requestLimit, ...searchFilters } = filters;
    const limit = CursorPaginationHelper.validateLimit(requestLimit);

    const queryBuilder = this.repository
      .createQueryBuilder('transaccion')
      .leftJoinAndSelect('transaccion.anuncio', 'anuncio')
      .leftJoinAndSelect('transaccion.user', 'user')
      .where('transaccion.tenantId = :tenantId', { tenantId });

    // Aplicar cursor si existe
    if (cursor) {
      const cursorData = CursorPaginationHelper.decodeCursor(cursor);
      CursorPaginationHelper.applyCursorCondition(queryBuilder, cursorData, 'transaccion');
    }

    // Filtros
    if (searchFilters.status) {
      queryBuilder.andWhere('transaccion.status = :status', { status: searchFilters.status });
    }
    if (searchFilters.userId) {
      queryBuilder.andWhere('transaccion.userId = :userId', { userId: searchFilters.userId });
    }
    if (searchFilters.anuncioId) {
      queryBuilder.andWhere('transaccion.anuncioId = :anuncioId', { anuncioId: searchFilters.anuncioId });
    }
    if (searchFilters.minAmount) {
      queryBuilder.andWhere('transaccion.amount >= :minAmount', { minAmount: searchFilters.minAmount });
    }
    if (searchFilters.maxAmount) {
      queryBuilder.andWhere('transaccion.amount <= :maxAmount', { maxAmount: searchFilters.maxAmount });
    }

    // Ordenamiento y paginación por cursor
    queryBuilder
      .orderBy('transaccion.createdAt', 'DESC')
      .addOrderBy('transaccion.id', 'DESC')
      .limit(limit + 1);

    const data = await queryBuilder.getMany();
    return CursorPaginationHelper.buildResult(data, limit);
  }
}