import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface CursorData {
  createdAt: Date;
  id: string;
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor?: CursorData;
  hasMore: boolean;
}

export class CursorPaginationHelper {
  static readonly MAX_LIMIT = 100;
  static readonly DEFAULT_LIMIT = 20;

  static encodeCursor(cursor: CursorData): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
  }

  static decodeCursor(cursor: string): CursorData {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString());
      return {
        createdAt: new Date(decoded.createdAt),
        id: decoded.id
      };
    } catch (error) {
      throw new Error('Cursor inválido');
    }
  }

  static validateLimit(limit?: number): number {
    if (!limit) return this.DEFAULT_LIMIT;
    if (limit > this.MAX_LIMIT) return this.MAX_LIMIT;
    if (limit < 1) return this.DEFAULT_LIMIT;
    return limit;
  }

  static applyCursorCondition<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    cursor: CursorData,
    alias: string
  ): void {
    queryBuilder.andWhere(
      `(${alias}.createdAt < :cursorCreatedAt OR (${alias}.createdAt = :cursorCreatedAt AND ${alias}.id < :cursorId))`,
      {
        cursorCreatedAt: cursor.createdAt,
        cursorId: cursor.id
      }
    );
  }

  static buildResult<T extends { createdAt: Date; id: string }>(
    data: T[],
    limit: number
  ): CursorPaginationResult<T> {
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;
    
    const nextCursor = hasMore && items.length > 0 
      ? { createdAt: items[items.length - 1].createdAt, id: items[items.length - 1].id }
      : undefined;

    return {
      data: items,
      nextCursor,
      hasMore
    };
  }
}