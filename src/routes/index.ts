import { Router } from 'express';
import { userRoutes } from '@/app/modules/user/user.routes';
import { authRoutes } from '@/app/modules/auth/auth.routes';
import { ResponseUtils } from '@/utils/response';
import { Request, Response } from 'express';
import config from '@/config';

/**
 * Main router instance
 */
const router = Router();

/**
 * API version information
 */
const API_VERSION = '1.0.0';
const API_PREFIX = '/api/v1';

/**
 * Root API endpoint
 */
router.get('/', (req: Request, res: Response) => {
  ResponseUtils.success(res, {
    message: `${config.project.displayName} API`,
    version: API_VERSION,
    timestamp: new Date().toISOString(),
    documentation: `${req.protocol}://${req.get('host')}/api/docs`,
    endpoints: {
      health: '/health',
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
    },
    features: [
      'User Authentication & Authorization',
      'JWT Token Management',
      'File Upload with Cloudinary',
      'Input Validation with Zod',
      'Comprehensive Error Handling',
      'Request Logging & Monitoring',
      'Rate Limiting & Security',
      'Database Integration with MongoDB',
    ],
  }, `Welcome to ${config.project.displayName} API`);
});

/**
 * API status endpoint
 */
router.get('/status', (req: Request, res: Response) => {
  ResponseUtils.success(res, {
    status: 'operational',
    version: API_VERSION,
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      authentication: 'active',
      fileUpload: process.env.ENABLE_CLOUDINARY === 'true' ? 'enabled' : 'disabled',
      logging: 'active',
      rateLimit: 'active',
    },
  }, 'API status check');
});

/**
 * Mount module routes
 */
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

/**
 * API documentation endpoint
 */
router.get('/docs', (req: Request, res: Response) => {
  ResponseUtils.success(res, {
    title: `${config.project.displayName} API Documentation`,
    version: config.project.version,
    description: config.project.description,
    baseUrl: `${req.protocol}://${req.get('host')}${API_PREFIX}`,
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      endpoints: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh-token',
        logout: 'POST /auth/logout',
      },
    },
    endpoints: {
      auth: {
        register: {
          method: 'POST',
          path: '/auth/register',
          description: 'Register a new user account',
          public: true,
        },
        login: {
          method: 'POST',
          path: '/auth/login',
          description: 'Login with email and password',
          public: true,
        },
        logout: {
          method: 'POST',
          path: '/auth/logout',
          description: 'Logout and invalidate tokens',
          protected: true,
        },
        refreshToken: {
          method: 'POST',
          path: '/auth/refresh-token',
          description: 'Refresh access token using refresh token',
          public: true,
        },
        forgotPassword: {
          method: 'POST',
          path: '/auth/forgot-password',
          description: 'Request password reset email',
          public: true,
        },
        resetPassword: {
          method: 'POST',
          path: '/auth/reset-password',
          description: 'Reset password using reset token',
          public: true,
        },
        verifyEmail: {
          method: 'POST',
          path: '/auth/verify-email',
          description: 'Verify email address using verification token',
          public: true,
        },
        me: {
          method: 'GET',
          path: '/auth/me',
          description: 'Get current user profile',
          protected: true,
        },
      },
      users: {
        getAll: {
          method: 'GET',
          path: '/users',
          description: 'Get all users (admin only)',
          protected: true,
          adminOnly: true,
        },
        getById: {
          method: 'GET',
          path: '/users/:id',
          description: 'Get user by ID',
          protected: true,
        },
        updateProfile: {
          method: 'PATCH',
          path: '/users/profile',
          description: 'Update current user profile',
          protected: true,
        },
        changePassword: {
          method: 'PATCH',
          path: '/users/change-password',
          description: 'Change user password',
          protected: true,
        },
        uploadAvatar: {
          method: 'POST',
          path: '/users/avatar',
          description: 'Upload user avatar image',
          protected: true,
        },
        deleteUser: {
          method: 'DELETE',
          path: '/users/:id',
          description: 'Delete user account',
          protected: true,
          adminOnly: true,
        },
        getStats: {
          method: 'GET',
          path: '/users/stats',
          description: 'Get user statistics',
          protected: true,
          adminOnly: true,
        },
      },
    },
    responseFormat: {
      success: {
        success: true,
        message: 'string',
        data: 'any',
        meta: {
          timestamp: 'ISO string',
          requestId: 'string',
        },
      },
      error: {
        success: false,
        message: 'string',
        error: {
          code: 'string',
          details: 'any',
        },
        meta: {
          timestamp: 'ISO string',
          requestId: 'string',
        },
      },
    },
    statusCodes: {
      200: 'OK - Request successful',
      201: 'Created - Resource created successfully',
      400: 'Bad Request - Invalid request data',
      401: 'Unauthorized - Authentication required',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      409: 'Conflict - Resource already exists',
      422: 'Unprocessable Entity - Validation error',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error',
    },
  }, 'API Documentation');
});

/**
 * Export the main router
 */
export default router;

/**
 * Export individual route modules for direct access
 */
export {
  userRoutes,
  authRoutes,
};