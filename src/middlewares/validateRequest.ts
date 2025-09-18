import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { BadRequestError } from '@/shared/errors';
import { MESSAGES } from '@/shared/constants';
import { asyncHandler } from './errorHandler';

/**
 * Middleware to validate request data using Zod schemas
 */
export const validateRequest = (schema: AnyZodObject) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request data against the schema
      const validatedData = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        cookies: req.cookies,
      });

      // Replace request data with validated data
      req.body = validatedData.body || req.body;
      req.query = validatedData.query || req.query;
      req.params = validatedData.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: 'received' in err ? err.received : undefined,
        }));

        throw new BadRequestError(`${MESSAGES.VALIDATION_ERROR}: ${formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
      }

      // Re-throw other errors
      throw error;
    }
  });
};

/**
 * Middleware to validate only request body
 */
export const validateBody = (schema: AnyZodObject) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedBody = await schema.parseAsync(req.body);
      req.body = validatedBody;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: 'received' in err ? err.received : undefined,
        }));

        throw new BadRequestError(`${MESSAGES.VALIDATION_ERROR}: ${formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
      }

      throw error;
    }
  });
};

/**
 * Middleware to validate only query parameters
 */
export const validateQuery = (schema: AnyZodObject) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedQuery = await schema.parseAsync(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: 'received' in err ? err.received : undefined,
        }));

        throw new BadRequestError(`${MESSAGES.VALIDATION_ERROR}: ${formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
      }

      throw error;
    }
  });
};

/**
 * Middleware to validate only route parameters
 */
export const validateParams = (schema: AnyZodObject) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedParams = await schema.parseAsync(req.params);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          received: 'received' in err ? err.received : undefined,
        }));

        throw new BadRequestError(`${MESSAGES.VALIDATION_ERROR}: ${formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`);
      }

      throw error;
    }
  });
};

/**
 * Middleware to validate file uploads
 */
export const validateFile = (options: {
  required?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { required = false, maxSize, allowedTypes, maxFiles } = options;

    // Check if file is required
    if (required && !req.file && !req.files) {
      throw new BadRequestError(MESSAGES.FILE_REQUIRED);
    }

    // If no file uploaded and not required, continue
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.file]) : [req.file];
    const validFiles = files.filter(Boolean);

    // Check number of files
    if (maxFiles && validFiles.length > maxFiles) {
      throw new BadRequestError(`Maximum ${maxFiles} files allowed`);
    }

    // Validate each file
    for (const file of validFiles) {
      if (!file) continue;

      // Check file size
      if (maxSize && file.size > maxSize) {
        throw new BadRequestError(
          `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
        );
      }

      // Check file type
      if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
        throw new BadRequestError(
          `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`
        );
      }
    }

    next();
  });
};

/**
 * Middleware to sanitize request data
 */
export const sanitizeRequest = () => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Basic sanitization - remove null bytes and trim strings
    const sanitizeObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/\0/g, '').trim();
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      
      return obj;
    };

    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);

    next();
  });
};

/**
 * Middleware to validate content type
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      throw new BadRequestError('Content-Type header is required');
    }

    const isAllowed = allowedTypes.some(type => 
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      throw new BadRequestError(
        `Content-Type ${contentType} not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Middleware to validate request size
 */
export const validateRequestSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      throw new BadRequestError(
        `Request size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
      );
    }

    next();
  };
};

export default {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
  validateFile,
  sanitizeRequest,
  validateContentType,
  validateRequestSize,
};