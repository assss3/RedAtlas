import { TransaccionService } from '../../src/modules/transaccion/transaccion.service';
import { TransaccionRepository } from '../../src/modules/transaccion/transaccion.repository';
import { AnuncioService } from '../../src/modules/anuncio/anuncio.service';
import { PropiedadService } from '../../src/modules/propiedad/propiedad.service';
import { CacheService } from '../../src/shared/services/cache.service';
import { NotFoundError } from '../../src/core/errors';
import { TransactionStatus } from '../../src/modules/transaccion/transaccion.interfaces';
import { AnuncioStatus } from '../../src/modules/anuncio/anuncio.interfaces';
import { PropiedadStatus } from '../../src/modules/propiedad/propiedad.interfaces';

jest.mock('../../src/modules/transaccion/transaccion.repository');
jest.mock('../../src/modules/anuncio/anuncio.service');
jest.mock('../../src/modules/propiedad/propiedad.service');
jest.mock('../../src/shared/services/cache.service');

describe('TransaccionService', () => {
  let service: TransaccionService;
  let repository: jest.Mocked<TransaccionRepository>;
  let anuncioService: jest.Mocked<AnuncioService>;
  let propiedadService: jest.Mocked<PropiedadService>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    repository = new TransaccionRepository() as jest.Mocked<TransaccionRepository>;
    anuncioService = new AnuncioService({} as any) as jest.Mocked<AnuncioService>;
    propiedadService = new PropiedadService({} as any) as jest.Mocked<PropiedadService>;
    cacheService = {
      getOrSet: jest.fn(),
      invalidateEntity: jest.fn(),
      generateKey: jest.fn()
    } as any;
    service = new TransaccionService(repository, anuncioService, propiedadService, cacheService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create transaccion and update related entities', async () => {
      const transaccionData = {
        anuncioId: 'anuncio-1',
        amount: 100000,
        tenantId: 'tenant-1',
        userId: 'user-1'
      };
      const createdTransaccion = { ...transaccionData, id: 'trans-1', status: TransactionStatus.PENDIENTE };
      const anuncio = { id: 'anuncio-1', propertyId: 'prop-1', tenantId: 'tenant-1' };

      repository.create.mockResolvedValue(createdTransaccion as any);
      anuncioService.findById.mockResolvedValue(anuncio as any);
      anuncioService.updateStatusByPropertyId.mockResolvedValue();
      propiedadService.updateStatus.mockResolvedValue();
      cacheService.invalidateEntity.mockResolvedValue();

      const result = await service.create(transaccionData);

      expect(repository.create).toHaveBeenCalledWith({
        ...transaccionData,
        status: TransactionStatus.PENDIENTE
      });
      expect(anuncioService.findById).toHaveBeenCalledWith('anuncio-1', 'tenant-1');
      expect(anuncioService.updateStatusByPropertyId).toHaveBeenCalledWith('prop-1', AnuncioStatus.RESERVADO, 'tenant-1');
      expect(propiedadService.updateStatus).toHaveBeenCalledWith('prop-1', PropiedadStatus.NO_DISPONIBLE, 'tenant-1');
      expect(result).toEqual(createdTransaccion);
    });
  });

  describe('cancel', () => {
    it('should cancel transaccion and restore property availability', async () => {
      const transaccion = { id: 'trans-1', anuncioId: 'anuncio-1', tenantId: 'tenant-1' };
      const anuncio = { id: 'anuncio-1', propertyId: 'prop-1', tenantId: 'tenant-1' };
      const updatedTransaccion = { ...transaccion, status: TransactionStatus.CANCELADA };

      cacheService.getOrSet.mockImplementation(async (key, ttl, fn) => {
        repository.findById.mockResolvedValue(transaccion as any);
        return await fn();
      });
      repository.update.mockResolvedValue(updatedTransaccion as any);
      anuncioService.findById.mockResolvedValue(anuncio as any);
      anuncioService.updateStatusByPropertyId.mockResolvedValue();
      propiedadService.updateStatus.mockResolvedValue();
      cacheService.invalidateEntity.mockResolvedValue();

      const result = await service.cancel('trans-1', 'tenant-1');

      expect(repository.update).toHaveBeenCalledWith('trans-1', { status: TransactionStatus.CANCELADA }, 'tenant-1');
      expect(anuncioService.updateStatusByPropertyId).toHaveBeenCalledWith('prop-1', AnuncioStatus.ACTIVO, 'tenant-1');
      expect(propiedadService.updateStatus).toHaveBeenCalledWith('prop-1', PropiedadStatus.DISPONIBLE, 'tenant-1');
      expect(result).toEqual(updatedTransaccion);
    });
  });

  describe('complete', () => {
    it('should complete transaccion and set anuncios to inactive', async () => {
      const transaccion = { id: 'trans-1', anuncioId: 'anuncio-1', tenantId: 'tenant-1' };
      const anuncio = { id: 'anuncio-1', propertyId: 'prop-1', tenantId: 'tenant-1' };
      const updatedTransaccion = { ...transaccion, status: TransactionStatus.COMPLETADA };

      cacheService.getOrSet.mockImplementation(async (key, ttl, fn) => {
        repository.findById.mockResolvedValue(transaccion as any);
        return await fn();
      });
      repository.update.mockResolvedValue(updatedTransaccion as any);
      anuncioService.findById.mockResolvedValue(anuncio as any);
      anuncioService.updateStatusByPropertyId.mockResolvedValue();
      cacheService.invalidateEntity.mockResolvedValue();

      const result = await service.complete('trans-1', 'tenant-1');

      expect(repository.update).toHaveBeenCalledWith('trans-1', { status: TransactionStatus.COMPLETADA }, 'tenant-1');
      expect(anuncioService.updateStatusByPropertyId).toHaveBeenCalledWith('prop-1', AnuncioStatus.INACTIVO, 'tenant-1');
      expect(result).toEqual(updatedTransaccion);
    });
  });

  describe('searchWithFilters', () => {
    it('should search transacciones with filters', async () => {
      const filters = { tenantId: 'tenant-1', status: 'pendiente' };
      const searchResults = { data: [], hasMore: false };

      cacheService.generateKey.mockReturnValue('cache-key');
      cacheService.getOrSet.mockResolvedValue(searchResults);

      const result = await service.searchWithFilters(filters);

      expect(cacheService.generateKey).toHaveBeenCalledWith('transactions_search', 'tenant-1', filters);
      expect(cacheService.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(searchResults);
    });
  });
});