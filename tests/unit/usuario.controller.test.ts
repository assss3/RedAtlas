import { Request, Response, NextFunction } from 'express';
import { UsuarioController } from '../../src/modules/usuario/usuario.controller';
import { UsuarioService } from '../../src/modules/usuario/usuario.service';
import { AuthenticatedRequest } from '../../src/core/interfaces';
import { UserRole } from '../../src/modules/usuario/usuario.interfaces';

jest.mock('../../src/modules/usuario/usuario.service');

describe('UsuarioController', () => {
  let controller: UsuarioController;
  let service: jest.Mocked<UsuarioService>;
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    service = new UsuarioService({} as any) as jest.Mocked<UsuarioService>;
    controller = new UsuarioController(service);
    
    req = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      userRole: UserRole.ADMIN,
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
    it('should create user successfully', async () => {
      const userData = { nombre: 'Test User', email: 'test@example.com' };
      const createdUser = { ...userData, id: 'user-1' };
      
      req.body = userData;
      service.create.mockResolvedValue(createdUser as any);

      await controller.create(req as AuthenticatedRequest, res as Response, next);

      expect(service.create).toHaveBeenCalledWith({
        ...userData,
        tenantId: 'tenant-1'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdUser);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      service.create.mockRejectedValue(error);

      await controller.create(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const user = { id: 'user-1', nombre: 'Test User' };
      req.params = { id: 'user-1' };
      service.findById.mockResolvedValue(user as any);

      await controller.findById(req as AuthenticatedRequest, res as Response, next);

      expect(service.findById).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(res.json).toHaveBeenCalledWith(user);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginatedResult = { data: [], hasMore: false };
      req.query = { cursor: 'cursor-1', limit: '20' };
      service.findAll.mockResolvedValue(paginatedResult as any);

      await controller.findAll(req as AuthenticatedRequest, res as Response, next);

      expect(service.findAll).toHaveBeenCalledWith('tenant-1');
      expect(res.json).toHaveBeenCalledWith(paginatedResult);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateData = { nombre: 'Updated Name' };
      const updatedUser = { id: 'user-1', ...updateData };
      
      req.params = { id: 'user-1' };
      req.body = updateData;
      service.update.mockResolvedValue(updatedUser as any);

      await controller.update(req as AuthenticatedRequest, res as Response, next);

      expect(service.update).toHaveBeenCalledWith('user-1', updateData, 'tenant-1');
      expect(res.json).toHaveBeenCalledWith(updatedUser);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      req.params = { id: 'user-1' };
      service.delete.mockResolvedValue();

      await controller.delete(req as AuthenticatedRequest, res as Response, next);

      expect(service.delete).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});