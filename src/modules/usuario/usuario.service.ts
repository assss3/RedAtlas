import bcrypt from 'bcryptjs';
import { Usuario } from './usuario.entity';
import { UsuarioRepository } from './usuario.repository';
import { ValidationError, NotFoundError } from '../../core/errors';

export class UsuarioService {
  constructor(private usuarioRepository: UsuarioRepository) {}

  async create(data: Partial<Usuario>): Promise<Usuario> {
    const existing = await this.usuarioRepository.findByEmail(data.email!, data.tenantId!);
    if (existing) {
      throw new ValidationError('El email ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(data.passwordHash!, 10);
    return await this.usuarioRepository.create({
      ...data,
      passwordHash: hashedPassword,
    });
  }

  async findById(id: string, tenantId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findById(id, tenantId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }
    return usuario;
  }

  async findAll(tenantId: string): Promise<Usuario[]> {
    return await this.usuarioRepository.findAll(tenantId);
  }

  async update(id: string, data: Partial<Usuario>, tenantId: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.update(id, data, tenantId);
    if (!usuario) {
      throw new NotFoundError('Usuario');
    }
    return usuario;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const deleted = await this.usuarioRepository.delete(id, tenantId);
    if (!deleted) {
      throw new NotFoundError('Usuario');
    }
  }
}