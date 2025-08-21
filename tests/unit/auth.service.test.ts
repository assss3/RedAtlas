import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UserRole } from '../../src/modules/usuario/usuario.interfaces';

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn().mockReturnValue({
      findOne: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn()
    })
  }
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepo: any;
  let mockRefreshTokenRepo: any;

  beforeEach(() => {
    const { AppDataSource } = require('../../src/config/database');
    mockUserRepo = {
      findOne: jest.fn()
    };
    mockRefreshTokenRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn()
    };
    AppDataSource.getRepository.mockImplementation((entity: any) => {
      if (entity.name === 'Usuario') return mockUserRepo;
      if (entity.name === 'RefreshToken') return mockRefreshTokenRepo;
      return {};
    });
    
    service = new AuthService();
    jest.clearAllMocks();
    
    process.env.JWT_SECRET = 'test-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  });

  describe('login', () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      tenantId: 'tenant-1',
      rol: UserRole.USER,
      nombre: 'Test User'
    };

    it('should login successfully with valid credentials', async () => {
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await service.login('test@example.com', 'password123');

      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: expect.objectContaining({
          id: 'user-1',
          email: 'test@example.com'
        })
      });
    });

    it('should throw Error with invalid email', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.login('test@example.com', 'password123')).rejects.toThrow('Invalid credentials');
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw Error with invalid password', async () => {
      mockUserRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('test@example.com', 'password123')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const payload = { userId: 'user-1', tenantId: 'tenant-1' };
      const storedToken = { 
        token: 'valid-refresh-token', 
        userId: 'user-1', 
        expiresAt: new Date(Date.now() + 86400000),
        user: { rol: UserRole.USER }
      };
      
      (jwt.verify as jest.Mock).mockReturnValue(payload);
      mockRefreshTokenRepo.findOne.mockResolvedValue(storedToken);
      mockRefreshTokenRepo.remove.mockResolvedValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});
      (jwt.sign as jest.Mock).mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(jwt.verify).toHaveBeenCalledWith('valid-refresh-token', 'test-refresh-secret');
      expect(result).toEqual({ 
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });
    });

    it('should throw Error with invalid refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow('Invalid refresh token');
    });
  });
});