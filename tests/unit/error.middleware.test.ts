import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../src/config/error.middleware';
import { ValidationError, NotFoundError, ApiError, ErrorTypes } from '../../src/core/errors';

describe('Error Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      originalUrl: '/api/test'
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should handle ApiError', () => {
    const error = new ApiError(
      400,
      ErrorTypes.VALIDATION_ERROR,
      'Validation Error',
      'Invalid input data',
      '/api/test'
    );

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      type: '/errors/validation-error',
      title: 'Validation Error',
      status: 400,
      detail: 'Invalid input data',
      instance: '/api/test'
    });
  });

  it('should handle legacy ValidationError', () => {
    const error = new ValidationError('Invalid input data');

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      type: '/errors/internal-error',
      title: 'Internal server error',
      status: 500,
      detail: 'Something went wrong',
      instance: '/api/test'
    });
  });

  it('should handle generic errors', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      type: '/errors/internal-error',
      title: 'Internal server error',
      status: 500,
      detail: 'Something went wrong',
      instance: '/api/test'
    });
  });

  it('should handle errors without message', () => {
    const error = new Error();

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      type: '/errors/internal-error',
      title: 'Internal server error',
      status: 500,
      detail: 'Something went wrong',
      instance: '/api/test'
    });
  });
});