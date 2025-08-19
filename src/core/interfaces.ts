import { Request } from 'express';
import { UserRole } from '../modules/usuario/usuario.interfaces';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  tenantId?: string;
}

export interface BaseRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  findById(id: string, tenantId: string): Promise<T | null>;
  findAll(tenantId: string): Promise<T[]>;
  update(id: string, entity: Partial<T>, tenantId: string): Promise<T | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  restore(id: string, tenantId: string): Promise<T | null>;
}