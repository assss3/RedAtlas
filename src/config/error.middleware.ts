import { Request, Response, NextFunction } from 'express';
import { ApiError, ErrorTypes } from '../core/errors';
import { config } from './env';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ApiError) {
    return res.status(error.status).json(error.toProblemDetails());
  }

  if (error.name === 'QueryFailedError') {
    const apiError = new ApiError(
      400,
      ErrorTypes.VALIDATION_ERROR,
      'Database validation failed',
      error.message,
      req.originalUrl
    );
    return res.status(400).json(apiError.toProblemDetails());
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    const apiError = new ApiError(
      403,
      ErrorTypes.AUTHENTICATION_ERROR,
      'Token validation failed',
      'Invalid or expired access token',
      req.originalUrl
    );
    return res.status(403).json(apiError.toProblemDetails());
  }

  // Handle multer errors
  if (error.message === 'Unexpected field' || (error as any).code === 'UNEXPECTED_FIELD') {
    const apiError = new ApiError(
      400,
      ErrorTypes.VALIDATION_ERROR,
      'File upload error',
      'Expected field name is "file"',
      req.originalUrl
    );
    return res.status(400).json(apiError.toProblemDetails());
  }

  if ((error as any).code === 'LIMIT_FILE_SIZE') {
    const apiError = new ApiError(
      400,
      ErrorTypes.VALIDATION_ERROR,
      'File too large',
      'File size exceeds 100MB limit',
      req.originalUrl
    );
    return res.status(400).json(apiError.toProblemDetails());
  } 

  const apiError = new ApiError(
    500,
    ErrorTypes.INTERNAL_ERROR,
    'Internal server error',
    config.nodeEnv === 'development' ? error.message : 'Something went wrong',
    req.originalUrl
  );

  res.status(500).json(apiError.toProblemDetails());
};