import redis from '../../config/redis';

export class LockService {
  private static instance: LockService;

  static getInstance(): LockService {
    if (!LockService.instance) {
      LockService.instance = new LockService();
    }
    return LockService.instance;
  }

  async acquireLock(key: string, ttlSeconds: number = 30): Promise<string | null> {
    try {
      const lockValue = `${Date.now()}-${Math.random()}`;
      const result = await redis.set(key, lockValue, 'PX', ttlSeconds * 1000, 'NX');
      return result === 'OK' ? lockValue : null;
    } catch (error) {
      console.error('Lock acquisition error:', error);
      return null;
    }
  }

  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      const result = await redis.eval(script, 1, key, lockValue);
      return result === 1;
    } catch (error) {
      console.error('Lock release error:', error);
      return false;
    }
  }

  async withLock<T>(key: string, ttlSeconds: number, operation: () => Promise<T>): Promise<T> {
    const lockValue = await this.acquireLock(key, ttlSeconds);
    if (!lockValue) {
      throw new Error(`Could not acquire lock for key: ${key}`);
    }

    try {
      return await operation();
    } finally {
      await this.releaseLock(key, lockValue);
    }
  }
}