import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../core/interfaces';
import { ApiError, ErrorTypes } from '../core/errors';

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'ADMIN') {
    return next(new ApiError(
      403,
      ErrorTypes.AUTHORIZATION_ERROR,
      'Access denied',
      'Admin role required for this operation',
      req.originalUrl
    ));
  }
  next();
};