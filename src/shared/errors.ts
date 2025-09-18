import { StatusCodes } from 'http-status-codes';

/**
 * Base API Error class
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly path?: string;

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    path?: string
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.path = path;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad Request Error (400)
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request', path?: string) {
    super(message, StatusCodes.BAD_REQUEST, true, path);
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', path?: string) {
    super(message, StatusCodes.UNAUTHORIZED, true, path);
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', path?: string) {
    super(message, StatusCodes.FORBIDDEN, true, path);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', path?: string) {
    super(message, StatusCodes.NOT_FOUND, true, path);
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', path?: string) {
    super(message, StatusCodes.CONFLICT, true, path);
  }
}

/**
 * Validation Error (422)
 */
export class ValidationError extends ApiError {
  public readonly errors: any;

  constructor(message: string = 'Validation failed', errors?: any, path?: string) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY, true, path);
    this.errors = errors;
  }
}

/**
 * Too Many Requests Error (429)
 */
export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Too many requests', path?: string) {
    super(message, StatusCodes.TOO_MANY_REQUESTS, true, path);
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', path?: string) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, false, path);
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service unavailable', path?: string) {
    super(message, StatusCodes.SERVICE_UNAVAILABLE, true, path);
  }
}

/**
 * Database Error
 */
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database error', path?: string) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, false, path);
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends UnauthorizedError {
  constructor(message: string = 'Authentication failed', path?: string) {
    super(message, path);
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends ForbiddenError {
  constructor(message: string = 'Access denied', path?: string) {
    super(message, path);
  }
}

/**
 * Token Error
 */
export class TokenError extends UnauthorizedError {
  constructor(message: string = 'Invalid or expired token', path?: string) {
    super(message, path);
  }
}

/**
 * File Upload Error
 */
export class FileUploadError extends BadRequestError {
  constructor(message: string = 'File upload failed', path?: string) {
    super(message, path);
  }
}

/**
 * Email Error
 */
export class EmailError extends InternalServerError {
  constructor(message: string = 'Email service error', path?: string) {
    super(message, path);
  }
}

/**
 * Cloudinary Error
 */
export class CloudinaryError extends InternalServerError {
  constructor(message: string = 'Cloudinary service error', path?: string) {
    super(message, path);
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends TooManyRequestsError {
  constructor(message: string = 'Rate limit exceeded', path?: string) {
    super(message, path);
  }
}

/**
 * User Not Found Error
 */
export class UserNotFoundError extends NotFoundError {
  constructor(message: string = 'User not found', path?: string) {
    super(message, path);
  }
}

/**
 * Invalid Credentials Error
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message: string = 'Invalid email or password', path?: string) {
    super(message, path);
  }
}

/**
 * Email Already Exists Error
 */
export class EmailAlreadyExistsError extends ConflictError {
  constructor(message: string = 'Email already exists', path?: string) {
    super(message, path);
  }
}

/**
 * Password Mismatch Error
 */
export class PasswordMismatchError extends BadRequestError {
  constructor(message: string = 'Passwords do not match', path?: string) {
    super(message, path);
  }
}

/**
 * Weak Password Error
 */
export class WeakPasswordError extends BadRequestError {
  constructor(message: string = 'Password does not meet security requirements', path?: string) {
    super(message, path);
  }
}

/**
 * Check if error is operational
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof ApiError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Create error from status code
 */
export const createErrorFromStatusCode = (
  statusCode: number,
  message?: string,
  path?: string
): ApiError => {
  switch (statusCode) {
    case StatusCodes.BAD_REQUEST:
      return new BadRequestError(message, path);
    case StatusCodes.UNAUTHORIZED:
      return new UnauthorizedError(message, path);
    case StatusCodes.FORBIDDEN:
      return new ForbiddenError(message, path);
    case StatusCodes.NOT_FOUND:
      return new NotFoundError(message, path);
    case StatusCodes.CONFLICT:
      return new ConflictError(message, path);
    case StatusCodes.UNPROCESSABLE_ENTITY:
      return new ValidationError(message, undefined, path);
    case StatusCodes.TOO_MANY_REQUESTS:
      return new TooManyRequestsError(message, path);
    case StatusCodes.SERVICE_UNAVAILABLE:
      return new ServiceUnavailableError(message, path);
    default:
      return new InternalServerError(message, path);
  }
};

export default {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  TooManyRequestsError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  TokenError,
  FileUploadError,
  EmailError,
  CloudinaryError,
  RateLimitError,
  UserNotFoundError,
  InvalidCredentialsError,
  EmailAlreadyExistsError,
  PasswordMismatchError,
  WeakPasswordError,
  isOperationalError,
  createErrorFromStatusCode,
};