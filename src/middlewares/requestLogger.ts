import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger, stream } from '@/utils';
import config from '@/config';

/**
 * Custom token for Morgan to log request ID
 */
morgan.token('id', (req: Request) => {
  return req.id || 'unknown';
});

/**
 * Custom token for Morgan to log user ID
 */
morgan.token('user', (req: Request) => {
  return (req as any).user?.id || 'anonymous';
});

/**
 * Custom token for Morgan to log response time in a more readable format
 */
morgan.token('response-time-ms', (req: Request, res: Response) => {
  const responseTime = (res as any).responseTime;
  return responseTime ? `${responseTime}ms` : '-';
});

/**
 * Development format - detailed logging
 */
const developmentFormat = morgan(
  ':id :method :url :status :response-time-ms - :res[content-length] bytes - User: :user',
  {
    stream,
    skip: (req: Request, res: Response) => {
      // Skip health check endpoints in development
      return req.url === '/health' || req.url === '/api/health';
    },
  }
);

/**
 * Production format - concise logging
 */
const productionFormat = morgan('common', {
    stream,
  });

/**
 * Test format - minimal logging
 */
const testFormat = morgan('tiny', {
  stream,
  skip: () => true, // Skip all logging in test environment
});

/**
 * Request logger middleware
 * Automatically selects appropriate format based on environment
 */
export const requestLogger = (() => {
  switch (config.env) {
    case 'development':
      return developmentFormat;
    case 'production':
      return productionFormat;
    case 'test':
      return testFormat;
    default:
      return developmentFormat;
  }
})();

/**
 * Request ID middleware
 * Adds a unique ID to each request for tracking
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  req.id = req.headers['x-request-id'] as string || 
           `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Set response header for client tracking
  res.setHeader('X-Request-ID', req.id);
  
  next();
};

/**
 * Error logging middleware
 * Logs errors with request context
 */
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Request Error', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: config.env === 'development' ? error.stack : undefined,
    },
  });
  
  next(error);
};

export default {
  requestLogger,
  requestId,
  errorLogger,
};