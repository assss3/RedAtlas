import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../../config/database';
import { Usuario } from '../usuario/usuario.entity';
import { RefreshToken } from './refresh-token.entity';
import { UserRole } from '../usuario/usuario.interfaces';
import { config } from '../../config/env';

export class AuthService {
  private userRepo = AppDataSource.getRepository(Usuario);
  private refreshTokenRepo = AppDataSource.getRepository(RefreshToken);

  generateTokens(userId: string, tenantId: string, role: UserRole) {
    const accessToken = jwt.sign(
      { userId, tenantId, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    const refreshToken = jwt.sign(
      { userId, tenantId },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
    );

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(user.id, user.tenantId, user.rol);

    // Guardar refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.save({
      userId: user.id,
      tenantId: user.tenantId,
      token: refreshToken,
      expiresAt
    });

    return { accessToken, refreshToken, user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol } };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      
      const storedToken = await this.refreshTokenRepo.findOne({
        where: { token: refreshToken, userId: decoded.userId },
        relations: ['user']
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid refresh token');
      }

      // Invalidar token actual
      await this.refreshTokenRepo.remove(storedToken);

      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(
        decoded.userId,
        decoded.tenantId,
        storedToken.user.rol
      );

      // Crear nuevo refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await this.refreshTokenRepo.save({
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        token: newRefreshToken,
        expiresAt
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await this.refreshTokenRepo.delete({ token: refreshToken });
  }
}