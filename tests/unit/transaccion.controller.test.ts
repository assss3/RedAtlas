import { Response, NextFunction } from 'express';
import { TransaccionController } from '../../src/modules/transaccion/transaccion.controller';
import { TransaccionService } from '../../src/modules/transaccion/transaccion.service';
import { AuthenticatedRequest } from '../../src/core/interfaces';
import { UserRole } from '../../src/modules/usuario/usuario.interfaces';
import { ValidationError } from '../../src/core/errors';

jest.mock('../../src/modules/transaccion/transaccion.service');

describe('TransaccionController', () => {
  let controller: TransaccionController;
  let service: jest.Mocked<TransaccionService>;
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    service = new TransaccionService({} as any, {} as any, {} as any) as jest.Mocked<TransaccionService>;
    controller = new TransaccionController(service);
    
    req = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      userRole: UserRole.USER,
      params: {},
      body: {},
      query: {}
    };
    
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create transaccion successfully for USER role', async () => {
      const transaccionData = { anuncioId: 'anuncio-1', amount: 100000 };
      const createdTransaccion = { ...transaccionData, id: 'trans-1' };
      
      req.body = transaccionData;
      service.create.mockResolvedValue(createdTransaccion as any);

      await controller.create(req as AuthenticatedRequest, res as Response, next);

      expect(service.create).toHaveBeenCalledWith({
        ...transaccionData,
        tenantId: 'tenant-1',
        userId: 'user-1'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdTransaccion);
    });

    it('should reject creation for ADMIN role', async () => {
      req.userRole = UserRole.ADMIN;

      await controller.create(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should cancel transaccion for ADMIN role', async () => {
      const cancelledTransaccion = { id: 'trans-1', status: 'cancelada' };
      
      req.userRole = UserRole.ADMIN;
      req.params = { id: 'trans-1' };
      service.cancel.mockResolvedValue(cancelledTransaccion as any);

      await controller.cancel(req as AuthenticatedRequest, res as Response, next);

      expect(service.cancel).toHaveBeenCalledWith('trans-1', 'tenant-1');
      expect(res.json).toHaveBeenCalledWith(cancelledTransaccion);
    });

    it('should reject cancellation for USER role', async () => {
      req.userRole = UserRole.USER;
      req.params = { id: 'trans-1' };

      await controller.cancel(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(service.cancel).not.toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('should complete transaccion for ADMIN role', async () => {
      const completedTransaccion = { id: 'trans-1', status: 'completada' };
      
      req.userRole = UserRole.ADMIN;
      req.params = { id: 'trans-1' };
      service.complete.mockResolvedValue(completedTransaccion as any);

      await controller.complete(req as AuthenticatedRequest, res as Response, next);

      expect(service.complete).toHaveBeenCalledWith('trans-1', 'tenant-1');
      expect(res.json).toHaveBeenCalledWith(completedTransaccion);
    });

    it('should reject completion for USER role', async () => {
      req.userRole = UserRole.USER;
      req.params = { id: 'trans-1' };

      await controller.complete(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      expect(service.complete).not.toHaveBeenCalled();
    });
  });

  describe('searchWithFilters', () => {
    it('should search transacciones with filters', async () => {
      const searchResults = { data: [], hasMore: false };
      req.query = { status: 'pendiente', limit: '10' };
      service.searchWithFilters.mockResolvedValue(searchResults as any);

      await controller.searchWithFilters(req as AuthenticatedRequest, res as Response, next);

      expect(service.searchWithFilters).toHaveBeenCalledWith({
        status: 'pendiente',
        limit: '10',
        tenantId: 'tenant-1'
      });
      expect(res.json).toHaveBeenCalledWith(searchResults);
    });
  });
});