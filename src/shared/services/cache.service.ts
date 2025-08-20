import redis from '../../config/redis';

export class CacheService {
  private static instance: CacheService;

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    callback: () => Promise<T>
  ): Promise<T> {
    try {
      // Intentar obtener del cache
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // Si no existe, ejecutar callback y cachear
      const result = await callback();
      await redis.setex(key, ttlSeconds, JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('Cache error:', error);
      // Si Redis falla, ejecutar callback sin cache
      return await callback();
    }
  }

  async invalidate(keyPattern: string): Promise<void> {
    try {
      const keys = await redis.keys(keyPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`🗑️ Invalidated ${keys.length} cache keys: ${keyPattern}`);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  generateKey(prefix: string, tenantId: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          result[key] = params[key];
        }
        return result;
      }, {} as Record<string, any>);

    const paramsString = Object.keys(sortedParams).length > 0 
      ? ':' + JSON.stringify(sortedParams).replace(/[{}":,]/g, '_')
      : '';

    return `${prefix}:${tenantId}${paramsString}`;
  }

  async invalidateEntity(entityName: string, tenantId: string, id?: string): Promise<void> {
    const patterns = [
      `${entityName}s:${tenantId}*`,
      `${entityName}s_search:${tenantId}*`
    ];
    
    if (id) {
      patterns.push(`${entityName}:${tenantId}:${id}`);
    }
    
    await Promise.all(patterns.map(pattern => this.invalidate(pattern)));
  }
}