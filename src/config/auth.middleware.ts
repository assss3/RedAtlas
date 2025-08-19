import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../core/interfaces';
import { ApiError, ErrorTypes } from '../core/errors';

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (!token) {
    return next(new ApiError(
      401,
      ErrorTypes.AUTHENTICATION_ERROR,
      'Authentication required',
      'Access token is required',
      req.originalUrl
    ));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.userId = decoded.userId;
    req.tenantId = decoded.tenantId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    next(new ApiError(
      403,
      ErrorTypes.AUTHENTICATION_ERROR,
      'Token validation failed',
      'Invalid or expired access token',
      req.originalUrl
    ));
  }
};