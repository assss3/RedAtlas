import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors';
import { AuthenticatedRequest, UserRole } from '../core/interfaces';

export const tenantMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return res.status(400).json({
      type: 'https://example.com/errors/missing-tenant',
      title: 'Missing tenant ID',
      status: 400,
      detail: 'x-tenant-id header is required',
    });
  }
  req.tenantId = tenantId;
  next();
};

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Mock auth - en producción usar JWT
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as UserRole;
  
  if (!userId || !userRole) {
    return res.status(401).json({
      type: 'https://example.com/errors/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'Authentication required',
    });
  }
  
  req.userId = userId;
  req.userRole = userRole;
  next();
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.userRole;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        type: 'https://example.com/errors/forbidden',
        title: 'Forbidden',
        status: 403,
        detail: 'Insufficient permissions',
      });
    }
    next();
  };
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      type: err.type,
      title: err.message,
      status: err.statusCode,
      detail: err.detail,
    });
  }

  console.error(err);
  res.status(500).json({
    type: 'https://example.com/errors/internal',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
  });
};