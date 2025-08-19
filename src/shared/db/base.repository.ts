import { Repository, FindOptionsWhere } from 'typeorm';
import { BaseRepository } from '../../core/interfaces';
import { CursorPaginationHelper, CursorPaginationResult } from '../utils/cursor-pagination.helper';

export abstract class BaseRepositoryImpl<T extends { id: string; tenantId: string; deletedAt?: Date; createdAt: Date }> implements BaseRepository<T> {
  constructor(protected repository: Repository<T>) {}

  async create(entity: Partial<T>): Promise<T> {
    const created = this.repository.create(entity as any);
    const saved = await this.repository.save(created);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findById(id: string, tenantId: string): Promise<T | null> {
    const where: FindOptionsWhere<T> = { id, tenantId } as any;
    return await this.repository.findOne({ where });
  }

  async findAll(tenantId: string, cursor?: string, limit?: number): Promise<CursorPaginationResult<T>> {
    const validLimit = CursorPaginationHelper.validateLimit(limit);
    const tableName = this.repository.metadata.tableName;
    
    const queryBuilder = this.repository
      .createQueryBuilder(tableName)
      .where(`${tableName}.tenantId = :tenantId`, { tenantId });

    if (cursor) {
      const cursorData = CursorPaginationHelper.decodeCursor(cursor);
      CursorPaginationHelper.applyCursorCondition(queryBuilder, cursorData, tableName);
    }

    queryBuilder
      .orderBy(`${tableName}.createdAt`, 'DESC')
      .addOrderBy(`${tableName}.id`, 'DESC')
      .limit(validLimit + 1);

    const data = await queryBuilder.getMany();
    return CursorPaginationHelper.buildResult(data, validLimit);
  }

  async update(id: string, entity: Partial<T>, tenantId: string): Promise<T | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;
    
    await this.repository.update({ id, tenantId } as any, entity as any);
    return await this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.repository.softDelete({ id, tenantId } as any);
    return result.affected ? result.affected > 0 : false;
  }

  async restore(id: string, tenantId: string): Promise<T | null> {
    await this.repository.restore({ id, tenantId } as any);
    return await this.repository.findOne({ 
      where: { id, tenantId } as any,
      withDeleted: true 
    });
  }
}