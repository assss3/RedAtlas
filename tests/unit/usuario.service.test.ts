import bcrypt from 'bcryptjs';
import { UsuarioService } from '../../src/modules/usuario/usuario.service';
import { UsuarioRepository } from '../../src/modules/usuario/usuario.repository';
import { ValidationError, NotFoundError } from '../../src/core/errors';
import { UserRole } from '../../src/modules/usuario/usuario.interfaces';

jest.mock('bcryptjs');
jest.mock('../../src/modules/usuario/usuario.repository');

describe('UsuarioService', () => {
  let service: UsuarioService;
  let repository: jest.Mocked<UsuarioRepository>;

  beforeEach(() => {
    repository = new UsuarioRepository() as jest.Mocked<UsuarioRepository>;
    service = new UsuarioService(repository);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userData = {
      email: 'test@example.com',
      passwordHash: 'password123',
      tenantId: 'tenant-1',
      nombre: 'Test User',
      rol: UserRole.USER
    };

    it('should create user successfully', async () => {
      repository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      repository.create.mockResolvedValue({ ...userData, id: 'user-1' } as any);

      const result = await service.create(userData);

      expect(repository.findByEmail).toHaveBeenCalledWith('test@example.com', 'tenant-1');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(repository.create).toHaveBeenCalledWith({
        ...userData,
        passwordHash: 'hashed-password'
      });
      expect(result.id).toBe('user-1');
    });

    it('should throw ValidationError if email exists', async () => {
      repository.findByEmail.mockResolvedValue({ id: 'existing-user' } as any);

      await expect(service.create(userData)).rejects.toThrow(ValidationError);
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const user = { id: 'user-1', email: 'test@example.com' };
      repository.findById.mockResolvedValue(user as any);

      const result = await service.findById('user-1', 'tenant-1');

      expect(repository.findById).toHaveBeenCalledWith('user-1', 'tenant-1');
      expect(result).toEqual(user);
    });

    it('should throw NotFoundError when user not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('user-1', 'tenant-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updatedUser = { id: 'user-1', nombre: 'Updated Name' };
      repository.update.mockResolvedValue(updatedUser as any);

      const result = await service.update('user-1', { nombre: 'Updated Name' }, 'tenant-1');

      expect(repository.update).toHaveBeenCalledWith('user-1', { nombre: 'Updated Name' }, 'tenant-1');
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundError when user not found', async () => {
      repository.update.mockResolvedValue(null);

      await expect(service.update('user-1', {}, 'tenant-1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      repository.delete.mockResolvedValue(true);

      await service.delete('user-1', 'tenant-1');

      expect(repository.delete).toHaveBeenCalledWith('user-1', 'tenant-1');
    });

    it('should throw NotFoundError when user not found', async () => {
      repository.delete.mockResolvedValue(false);

      await expect(service.delete('user-1', 'tenant-1')).rejects.toThrow(NotFoundError);
    });
  });
});