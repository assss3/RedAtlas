import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  tenantId?: string;
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface BaseRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  findById(id: string, tenantId: string): Promise<T | null>;
  findAll(tenantId: string): Promise<T[]>;
  update(id: string, entity: Partial<T>, tenantId: string): Promise<T | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  restore(id: string, tenantId: string): Promise<T | null>;
}