import { Request, Response, NextFunction } from 'express';
import { AppError } from '../core/errors';
import { AuthenticatedRequest } from '../core/interfaces';
import { UserRole } from '../modules/usuario/usuario.interfaces';


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