export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public type: string,
    public title: string,
    public detail?: string,
    public instance?: string,
    public extensions?: Record<string, any>
  ) {
    super(title);
  }

  toProblemDetails(): ProblemDetails {
    return {
      type: this.type,
      title: this.title,
      status: this.status,
      detail: this.detail,
      instance: this.instance,
      ...this.extensions
    };
  }
}

export const ErrorTypes = {
  VALIDATION_ERROR: '/errors/validation-error',
  AUTHENTICATION_ERROR: '/errors/authentication-error',
  AUTHORIZATION_ERROR: '/errors/authorization-error',
  NOT_FOUND: '/errors/not-found',
  CONFLICT: '/errors/conflict',
  INTERNAL_ERROR: '/errors/internal-error',
  BAD_REQUEST: '/errors/bad-request',
  SERVICE_UNAVAILABLE: '/errors/service-unavailable',
  UNPROCESSABLE_ENTITY: '/errors/unprocessable-entity',
  FORBIDDEN: '/errors/forbidden',
} as const;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly type: string;
  public readonly detail?: string;

  constructor(message: string, statusCode: number = 500, type: string = 'about:blank', detail?: string) {
    super(message);
    this.statusCode = statusCode;
    this.type = type;
    this.detail = detail;
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'https://example.com/errors/not-found');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, detail?: string) {
    super(message, 400, 'https://example.com/errors/validation', detail);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'https://example.com/errors/unauthorized');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'https://example.com/errors/forbidden');
  }
}