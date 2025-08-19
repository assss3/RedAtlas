import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError, ErrorTypes } from '../core/errors';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    throw new ApiError(
      400,
      ErrorTypes.VALIDATION_ERROR,
      'Validation failed',
      'The request contains invalid data',
      req.originalUrl,
      { errors: validationErrors }
    );
  }
  
  next();
};

export const validate = (validations: ValidationChain[]) => {
  return [...validations, handleValidationErrors];
};