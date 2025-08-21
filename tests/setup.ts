// Mock Redis para evitar conexiones reales en tests
jest.mock('../src/config/redis', () => ({
  __esModule: true,
  default: {
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
    setex: jest.fn().mockResolvedValue('OK'),
    eval: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK')
  }
}));

// Mock LockService para evitar conexiones Redis
jest.mock('../src/shared/services/lock.service', () => ({
  LockService: {
    getInstance: jest.fn(() => ({
      withLock: jest.fn((key, ttl, operation) => operation()),
      acquireLock: jest.fn().mockResolvedValue('lock-value'),
      releaseLock: jest.fn().mockResolvedValue(true)
    }))
  }
}));