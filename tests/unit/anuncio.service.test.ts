import { AnuncioService } from '../../src/modules/anuncio/anuncio.service';
import { AnuncioRepository } from '../../src/modules/anuncio/anuncio.repository';
import { CacheService } from '../../src/shared/services/cache.service';
import { NotFoundError } from '../../src/core/errors';
import { AnuncioStatus } from '../../src/modules/anuncio/anuncio.interfaces';

jest.mock('../../src/modules/anuncio/anuncio.repository');
jest.mock('../../src/shared/services/cache.service');

describe('AnuncioService', () => {
  let service: AnuncioService;
  let repository: jest.Mocked<AnuncioRepository>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    repository = new AnuncioRepository() as jest.Mocked<AnuncioRepository>;
    cacheService = {
      getOrSet: jest.fn(),
      invalidateEntity: jest.fn(),
      generateKey: jest.fn()
    } as any;
    service = new AnuncioService(repository, cacheService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create anuncio successfully', async () => {
      const anuncioData = {
        propertyId: 'prop-1',
        description: 'Test listing',
        tipo: 'venta' as any,
        price: 100000,
        tenantId: 'tenant-1'
      };
      const createdAnuncio = { ...anuncioData, id: 'anuncio-1' };

      repository.create.mockResolvedValue(createdAnuncio as any);
      cacheService.invalidateEntity.mockResolvedValue();

      const result = await service.create(anuncioData);

      expect(repository.create).toHaveBeenCalledWith(anuncioData);
      expect(cacheService.invalidateEntity).toHaveBeenCalledWith('listing', 'tenant-1');
      expect(result).toEqual(createdAnuncio);
    });
  });

  describe('findById', () => {
    it('should return cached anuncio', async () => {
      const anuncio = { id: 'anuncio-1', description: 'Test listing' };
      cacheService.getOrSet.mockResolvedValue(anuncio as any);

      const result = await service.findById('anuncio-1', 'tenant-1');

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(anuncio);
    });

    it('should throw NotFoundError when anuncio not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, ttl, fn) => {
        repository.findById.mockResolvedValue(null);
        return await fn();
      });

      await expect(service.findById('anuncio-1', 'tenant-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('searchWithFilters', () => {
    it('should search anuncios with basic filters', async () => {
      const filters = { tenantId: 'tenant-1', status: 'activo' };
      const searchResults = { data: [], hasMore: false };

      cacheService.generateKey.mockReturnValue('cache-key');
      cacheService.getOrSet.mockResolvedValue(searchResults);

      const result = await service.searchWithFilters(filters);

      expect(cacheService.generateKey).toHaveBeenCalledWith('anuncios_search', 'tenant-1', filters);
      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(searchResults);
    });
  });

  describe('searchWithPropertiesFilters', () => {
    it('should search anuncios with property filters', async () => {
      const filters = { tenantId: 'tenant-1', pais: 'Argentina' };
      const searchResults = { data: [], hasMore: false };

      cacheService.generateKey.mockReturnValue('cache-key');
      cacheService.getOrSet.mockResolvedValue(searchResults);

      const result = await service.searchWithPropertiesFilters(filters);

      expect(cacheService.generateKey).toHaveBeenCalledWith('listings_search', 'tenant-1', filters);
      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(searchResults);
    });
  });

  describe('updateStatusByPropertyId', () => {
    it('should update anuncio status by property id', async () => {
      repository.updateStatusByPropertyId.mockResolvedValue();

      await service.updateStatusByPropertyId('prop-1', AnuncioStatus.RESERVADO, 'tenant-1');

      expect(repository.updateStatusByPropertyId).toHaveBeenCalledWith('prop-1', AnuncioStatus.RESERVADO, 'tenant-1');
    });
  });
});