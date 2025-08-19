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
  PENDIENTE = 'pendiente',
  COMPLETADA = 'completada',
  CANCELADA = 'cancelada',
}

export enum PropiedadStatus {
  DISPONIBLE = 'disponible',
  NO_DISPONIBLE = 'no_disponible',
}

export enum PropertyType {
  DEPARTAMENTO = 'departamento',
  CASA = 'casa',
  TERRENO = 'terreno',
  LOCAL = 'local',
  OFICINA = 'oficina',
}

export enum OperationType {
  VENTA = 'venta',
  ALQUILER = 'alquiler',
}

export enum AnuncioStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  RESERVADO = 'reservado',
}

export interface BaseRepository<T> {
  create(entity: Partial<T>): Promise<T>;
  findById(id: string, tenantId: string): Promise<T | null>;
  findAll(tenantId: string): Promise<T[]>;
  update(id: string, entity: Partial<T>, tenantId: string): Promise<T | null>;
  delete(id: string, tenantId: string): Promise<boolean>;
  restore(id: string, tenantId: string): Promise<T | null>;
}