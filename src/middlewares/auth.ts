import { Request, Response, NextFunction } from 'express';
import { JWTUtils } from '@/utils';
import { UserService } from '@/app/modules/user/user.service';
import { AuthenticatedRequest, IJwtPayload } from '@/types';
import { IUserDocument } from '@/app/modules/user/user.interface';
import { UnauthorizedError, ForbiddenError } from '@/shared/errors';
import { MESSAGES, USER_ROLES } from '@/shared/constants';
import { asyncHandler } from './errorHandler';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export const authenticate = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedError(MESSAGES.ACCESS_TOKEN_REQUIRED);
    }

    // Extract token from "Bearer <token>" format
    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    if (!token) {
      throw new UnauthorizedError(MESSAGES.INVALID_TOKEN_FORMAT);
    }

    try {
      // Verify access token
      const decoded = JWTUtils.verifyAccessToken(token);
      
      if (!decoded) {
        throw new UnauthorizedError(MESSAGES.INVALID_ACCESS_TOKEN);
      }

      // Check if user still exists
      const user = await UserService.getUserById(decoded.userId);
      
      if (!user) {
        throw new UnauthorizedError(MESSAGES.USER_NOT_FOUND);
      }

      // Attach user info to request
      req.user = user as IUserDocument;

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      
      // Handle JWT-specific errors
      if (error instanceof Error) {
        if (error.name === 'JsonWebTokenError') {
          throw new UnauthorizedError(MESSAGES.INVALID_ACCESS_TOKEN);
        }
        
        if (error.name === 'TokenExpiredError') {
          throw new UnauthorizedError(MESSAGES.ACCESS_TOKEN_EXPIRED);
        }
        
        if (error.name === 'NotBeforeError') {
          throw new UnauthorizedError(MESSAGES.ACCESS_TOKEN_NOT_ACTIVE);
        }
      }
      
      throw new UnauthorizedError(MESSAGES.AUTHENTICATION_FAILED);
    }
  }
);

/**
 * Authorization middleware factory
 * Checks if user has required roles
 */
export const authorize = (allowedRoles: string[]) => {
  return asyncHandler<AuthenticatedRequest>(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      // Check if user is authenticated
      if (!req.user) {
        throw new UnauthorizedError(MESSAGES.AUTHENTICATION_REQUIRED);
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(MESSAGES.INSUFFICIENT_PERMISSIONS);
      }

      next();
    }
  );
};

/**
 * Admin-only middleware
 * Shorthand for authorize([USER_ROLES.ADMIN])
 */
export const adminOnly = authorize([USER_ROLES.ADMIN]);

/**
 * User or Admin middleware
 * Allows both regular users and admins
 */
export const userOrAdmin = authorize([USER_ROLES.USER, USER_ROLES.ADMIN]);

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export const optionalAuth = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = JWTUtils.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return next();
    }

    try {
      const decoded = JWTUtils.verifyAccessToken(token);
      
      if (decoded) {
        const user = await UserService.getUserById(decoded.userId);
        
        if (user) {
          req.user = user as IUserDocument;
        }
      }
    } catch (error) {
      // Silently ignore errors in optional auth
    }

    next();
  }
);

/**
 * Email verification required middleware
 * Ensures user has verified their email
 */
export const requireEmailVerification = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError(MESSAGES.AUTHENTICATION_REQUIRED);
    }

    if (!req.user.isEmailVerified) {
      throw new ForbiddenError(MESSAGES.EMAIL_VERIFICATION_REQUIRED);
    }

    next();
  }
);

/**
 * Resource ownership middleware factory
 * Ensures user can only access their own resources
 */
export const requireOwnership = (userIdParam: string = 'id') => {
  return asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw new UnauthorizedError(MESSAGES.AUTHENTICATION_REQUIRED);
      }

      const resourceUserId = req.params[userIdParam];
      const currentUserId = req.user._id;

      // Admin can access any resource
      if (req.user.role === USER_ROLES.ADMIN) {
        return next();
      }

      // User can only access their own resources
      if (resourceUserId !== currentUserId) {
        throw new ForbiddenError(MESSAGES.ACCESS_DENIED);
      }

      next();
    }
  );
};

/**
 * Rate limiting middleware for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimit = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // This would typically implement rate limiting logic
    // For now, just pass through
    // In production, you might use express-rate-limit or similar
    next();
  }
);

/**
 * API key authentication middleware (for API access)
 * Alternative authentication method for API clients
 */
export const authenticateApiKey = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new UnauthorizedError(MESSAGES.API_KEY_REQUIRED);
    }

    // This would typically validate the API key against a database
    // For now, just check against a simple config value
    // In production, implement proper API key validation
    
    throw new UnauthorizedError(MESSAGES.INVALID_API_KEY);
  }
);

/**
 * Session-based authentication middleware (alternative to JWT)
 * For applications that prefer session-based auth
 */
export const authenticateSession = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // This would typically check session storage (Redis, database, etc.)
    // For now, just throw an error as it's not implemented
    throw new UnauthorizedError('Session authentication not implemented');
  }
);

/**
 * Middleware to check if user account is active/not suspended
 */
export const requireActiveAccount = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError(MESSAGES.AUTHENTICATION_REQUIRED);
    }

    // Get fresh user data to check account status
    const user = await UserService.getUserById(req.user._id);
    
    if (!user) {
      throw new UnauthorizedError(MESSAGES.USER_NOT_FOUND);
    }

    // Check if account is suspended (this field would need to be added to user model)
    // if (user.isSuspended) {
    //   throw new ForbiddenError(MESSAGES.ACCOUNT_SUSPENDED);
    // }

    next();
  }
);

export default {
  authenticate,
  authorize,
  adminOnly,
  userOrAdmin,
  optionalAuth,
  requireEmailVerification,
  requireOwnership,
  authRateLimit,
  authenticateApiKey,
  authenticateSession,
  requireActiveAccount,
};