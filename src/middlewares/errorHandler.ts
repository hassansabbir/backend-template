import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { ApiError, isOperationalError } from '@/shared/errors';
import { ResponseUtils } from '@/utils/response';
import { MESSAGES } from '@/shared/constants';
import config from '@/config';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message: string = MESSAGES.INTERNAL_SERVER_ERROR;
  let errorDetails: any = undefined;

  // Log error for debugging
  console.error('Error occurred:', {
    name: error.name,
    message: error.message,
    stack: config.env === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Handle different types of errors
  if (error instanceof ApiError) {
    // Custom API errors
    statusCode = error.statusCode;
    message = error.message;
    if (error instanceof Error && 'errors' in error) {
      errorDetails = (error as any).errors;
    }
  } else if (error instanceof ZodError) {
    // Zod validation errors
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    message = MESSAGES.VALIDATION_ERROR;
    errorDetails = formatZodError(error);
  } else if (error instanceof mongoose.Error.ValidationError) {
    // Mongoose validation errors
    statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
    message = MESSAGES.VALIDATION_ERROR;
    errorDetails = formatMongooseValidationError(error);
  } else if (error instanceof mongoose.Error.CastError) {
    // Mongoose cast errors (invalid ObjectId, etc.)
    statusCode = StatusCodes.BAD_REQUEST;
    message = `Invalid ${error.path}: ${error.value}`;
  } else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    // MongoDB duplicate key error
    statusCode = StatusCodes.CONFLICT;
    message = formatDuplicateKeyError(error as any);
  } else if (error.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = StatusCodes.UNAUTHORIZED;
    message = MESSAGES.INVALID_TOKEN;
  } else if (error.name === 'TokenExpiredError') {
    // JWT token expired
    statusCode = StatusCodes.UNAUTHORIZED;
    message = MESSAGES.TOKEN_EXPIRED;
  } else if (error.name === 'MulterError') {
    // Multer file upload errors
    statusCode = StatusCodes.BAD_REQUEST;
    message = formatMulterError(error as any);
  } else if (error.name === 'SyntaxError' && 'body' in error) {
    // JSON parsing errors
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Invalid JSON in request body';
  }

  // Don't expose internal error details in production
  if (config.env === 'production' && !isOperationalError(error)) {
    message = MESSAGES.INTERNAL_SERVER_ERROR;
    errorDetails = undefined;
  }

  // Send error response
  return ResponseUtils.error(
    res,
    message,
    statusCode,
    config.env === 'development' ? errorDetails || error.stack : errorDetails
  );
};

/**
 * Format Zod validation errors
 */
const formatZodError = (error: ZodError): any => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
};

/**
 * Format Mongoose validation errors
 */
const formatMongooseValidationError = (error: mongoose.Error.ValidationError): any => {
  const errors: any = {};
  
  Object.keys(error.errors).forEach((key) => {
    const err = error.errors[key];
    errors[key] = {
      message: err?.message || 'Validation error',
      kind: err?.kind || 'unknown',
      value: err?.value || null,
    };
  });
  
  return errors;
};

/**
 * Format MongoDB duplicate key errors
 */
const formatDuplicateKeyError = (error: any): string => {
  if (!error.keyValue) return 'Duplicate key error';
  const field = Object.keys(error.keyValue)[0];
  if (!field) return 'Duplicate key error';
  const value = error.keyValue[field];
  return `${field} '${value}' already exists`;
};

/**
 * Format Multer errors
 */
const formatMulterError = (error: any): string => {
  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      return 'File size too large';
    case 'LIMIT_FILE_COUNT':
      return 'Too many files';
    case 'LIMIT_UNEXPECTED_FILE':
      return 'Unexpected file field';
    case 'LIMIT_FIELD_KEY':
      return 'Field name too long';
    case 'LIMIT_FIELD_VALUE':
      return 'Field value too long';
    case 'LIMIT_FIELD_COUNT':
      return 'Too many fields';
    case 'LIMIT_PART_COUNT':
      return 'Too many parts';
    default:
      return 'File upload error';
  }
};

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  return ResponseUtils.notFound(
    res,
    `Route ${req.method} ${req.originalUrl} not found`
  );
};

/**
 * Async error wrapper to catch async errors
 */
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: T, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    console.error('Shutting down due to uncaught exception...');
    process.exit(1);
  });
};

/**
 * Handle unhandled promise rejections
 */
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    console.error('Shutting down due to unhandled promise rejection...');
    process.exit(1);
  });
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleUncaughtException,
  handleUnhandledRejection,
};