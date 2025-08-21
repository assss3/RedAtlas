import { CursorPaginationHelper } from '../../src/shared/utils/cursor-pagination.helper';

describe('CursorPaginationHelper', () => {
  describe('validateLimit', () => {
    it('should return default limit when undefined', () => {
      const result = CursorPaginationHelper.validateLimit(undefined);
      expect(result).toBe(20);
    });

    it('should return provided limit when valid', () => {
      const result = CursorPaginationHelper.validateLimit(10);
      expect(result).toBe(10);
    });

    it('should return max limit when exceeds maximum', () => {
      const result = CursorPaginationHelper.validateLimit(150);
      expect(result).toBe(100);
    });

    it('should return default limit when below minimum', () => {
      const result = CursorPaginationHelper.validateLimit(0);
      expect(result).toBe(20);
    });
  });

  describe('encodeCursor', () => {
    it('should encode cursor data to base64', () => {
      const cursorData = { id: 'test-id', createdAt: new Date('2024-01-01T00:00:00.000Z') };
      const result = CursorPaginationHelper.encodeCursor(cursorData);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('decodeCursor', () => {
    it('should decode base64 cursor to data', () => {
      const cursorData = { id: 'test-id', createdAt: new Date('2024-01-01T00:00:00.000Z') };
      const encoded = CursorPaginationHelper.encodeCursor(cursorData);
      const decoded = CursorPaginationHelper.decodeCursor(encoded);
      
      expect(decoded.id).toBe(cursorData.id);
      expect(new Date(decoded.createdAt)).toEqual(cursorData.createdAt);
    });

    it('should throw error for invalid cursor', () => {
      expect(() => {
        CursorPaginationHelper.decodeCursor('invalid-cursor');
      }).toThrow();
    });
  });

  describe('buildResult', () => {
    it('should build paginated result with next cursor', () => {
      const data = [
        { id: '1', createdAt: new Date('2024-01-01T00:00:00.000Z') },
        { id: '2', createdAt: new Date('2024-01-02T00:00:00.000Z') },
        { id: '3', createdAt: new Date('2024-01-03T00:00:00.000Z') }
      ];
      const limit = 2;

      const result = CursorPaginationHelper.buildResult(data, limit);

      expect(result.data).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBeDefined();
    });

    it('should build result without next cursor when no more data', () => {
      const data = [
        { id: '1', createdAt: new Date('2024-01-01T00:00:00.000Z') }
      ];
      const limit = 2;

      const result = CursorPaginationHelper.buildResult(data, limit);

      expect(result.data).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe('applyCursorCondition', () => {
    it('should apply cursor condition to query builder', () => {
      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis()
      };
      const cursorData = { id: 'test-id', createdAt: new Date('2024-01-01T00:00:00.000Z') };

      CursorPaginationHelper.applyCursorCondition(mockQueryBuilder as any, cursorData, 'entity');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(entity.createdAt < :cursorCreatedAt OR (entity.createdAt = :cursorCreatedAt AND entity.id < :cursorId))',
        { cursorCreatedAt: cursorData.createdAt, cursorId: 'test-id' }
      );
    });
  });
});