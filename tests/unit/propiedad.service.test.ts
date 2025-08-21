import { PropiedadService } from '../../src/modules/propiedad/propiedad.service';
import { PropiedadRepository } from '../../src/modules/propiedad/propiedad.repository';
import { CacheService } from '../../src/shared/services/cache.service';
import { NotFoundError } from '../../src/core/errors';
import { PropiedadStatus } from '../../src/modules/propiedad/propiedad.interfaces';

jest.mock('../../src/modules/propiedad/propiedad.repository');
jest.mock('../../src/shared/services/cache.service');

describe('PropiedadService', () => {
  let service: PropiedadService;
  let repository: jest.Mocked<PropiedadRepository>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    repository = new PropiedadRepository() as jest.Mocked<PropiedadRepository>;
    cacheService = {
      getOrSet: jest.fn(),
      invalidateEntity: jest.fn(),
      generateKey: jest.fn()
    } as any;
    service = new PropiedadService(repository, cacheService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create propiedad successfully', async () => {
      const propiedadData = {
        title: 'Test Property',
        tipo: 'departamento' as any,
        superficie: 100,
        tenantId: 'tenant-1'
      };
      const createdPropiedad = { ...propiedadData, id: 'prop-1' };

      repository.create.mockResolvedValue(createdPropiedad as any);
      cacheService.invalidateEntity.mockResolvedValue();

      const result = await service.create(propiedadData);

      expect(repository.create).toHaveBeenCalledWith(propiedadData);
      expect(cacheService.invalidateEntity).toHaveBeenCalledWith('property', 'tenant-1');
      expect(result).toEqual(createdPropiedad);
    });
  });

  describe('findById', () => {
    it('should return cached propiedad', async () => {
      const propiedad = { id: 'prop-1', title: 'Test Property' };
      cacheService.getOrSet.mockResolvedValue(propiedad as any);

      const result = await service.findById('prop-1', 'tenant-1');

      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(propiedad);
    });

    it('should throw NotFoundError when propiedad not found', async () => {
      cacheService.getOrSet.mockImplementation(async (key, ttl, fn) => {
        repository.findById.mockResolvedValue(null);
        return await fn();
      });

      await expect(service.findById('prop-1', 'tenant-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('searchWithFilters', () => {
    it('should search with filters and cache results', async () => {
      const filters = { tenantId: 'tenant-1', tipo: 'departamento' };
      const searchResults = { data: [], hasMore: false };

      cacheService.generateKey.mockReturnValue('cache-key');
      cacheService.getOrSet.mockResolvedValue(searchResults);

      const result = await service.searchWithFilters(filters);

      expect(cacheService.generateKey).toHaveBeenCalledWith('properties_search', 'tenant-1', filters);
      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(searchResults);
    });
  });

  describe('updateStatus', () => {
    it('should update propiedad status', async () => {
      repository.update.mockResolvedValue({ id: 'prop-1' } as any);
      cacheService.invalidateEntity.mockResolvedValue();

      await service.updateStatus('prop-1', PropiedadStatus.NO_DISPONIBLE, 'tenant-1');

      expect(repository.update).toHaveBeenCalledWith('prop-1', { status: PropiedadStatus.NO_DISPONIBLE }, 'tenant-1');
      expect(cacheService.invalidateEntity).toHaveBeenCalledWith('property', 'tenant-1', 'prop-1');
    });
  });
});