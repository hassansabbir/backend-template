import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from './auth.service';
import { ResponseUtils } from '@/utils';
import { MESSAGES } from '@/shared/constants';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AuthenticatedRequest } from '@/types';

export class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const registerData = req.body;
    
    const result = await AuthService.register(registerData);
    
    ResponseUtils.created(res, {
      message: result.message,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const loginData = req.body;
    
    const result = await AuthService.login(loginData);
    
    ResponseUtils.success(res, {
      message: MESSAGES.LOGIN_SUCCESSFUL,
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh-token
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshTokenData = req.body;
    
    const result = await AuthService.refreshToken(refreshTokenData);
    
    ResponseUtils.success(res, {
      message: MESSAGES.TOKEN_REFRESHED_SUCCESSFULLY,
      data: result.tokens,
    });
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { refreshToken } = req.body;
    
    await AuthService.logout(userId, refreshToken);
    
    ResponseUtils.success(res, {
      message: MESSAGES.LOGOUT_SUCCESSFUL,
    });
  });

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  static logoutAllDevices = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    
    await AuthService.logoutAllDevices(userId);
    
    ResponseUtils.success(res, {
      message: MESSAGES.LOGOUT_ALL_SUCCESSFUL,
    });
  });

  /**
   * Forgot password
   * POST /api/auth/forgot-password
   */
  static forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const forgotPasswordData = req.body;
    
    const result = await AuthService.forgotPassword(forgotPasswordData);
    
    ResponseUtils.success(res, {
      message: result.message,
      ...(result.resetToken && { data: { resetToken: result.resetToken } }),
    });
  });

  /**
   * Reset password
   * POST /api/auth/reset-password
   */
  static resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const resetPasswordData = req.body;
    
    const result = await AuthService.resetPassword(resetPasswordData);
    
    ResponseUtils.success(res, {
      message: result.message,
    });
  });

  /**
   * Change password (authenticated user)
   * PUT /api/auth/change-password
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { currentPassword, newPassword } = req.body;
    
    await AuthService.changePassword(userId, currentPassword, newPassword);
    
    ResponseUtils.success(res, {
      message: MESSAGES.PASSWORD_CHANGED_SUCCESSFULLY,
    });
  });

  /**
   * Verify email
   * POST /api/auth/verify-email
   */
  static verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    
    const result = await AuthService.verifyEmail(token);
    
    ResponseUtils.success(res, {
      message: result.message,
      data: result.user,
    });
  });

  /**
   * Resend verification email
   * POST /api/auth/resend-verification
   */
  static resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    const result = await AuthService.resendVerificationEmail(email);
    
    ResponseUtils.success(res, {
      message: result.message,
    });
  });

  /**
   * Get current user
   * GET /api/auth/me
   */
  static getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    
    const user = await AuthService.getCurrentUser(userId);
    
    ResponseUtils.success(res, {
      message: MESSAGES.USER_RETRIEVED_SUCCESSFULLY,
      data: user,
    });
  });

  /**
   * Check authentication status
   * GET /api/auth/status
   */
  static checkAuthStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    
    ResponseUtils.success(res, {
      message: MESSAGES.AUTHENTICATED,
      data: {
        isAuthenticated: true,
        user: {
          userId: user._id,
          email: user.email,
          role: user.role,
        },
      },
    });
  });

  /**
   * Check email availability
   * POST /api/auth/check-email
   */
  static checkEmailAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    const isAvailable = await AuthService.isEmailAvailable(email);
    
    ResponseUtils.success(res, {
      message: isAvailable ? MESSAGES.EMAIL_AVAILABLE : MESSAGES.EMAIL_NOT_AVAILABLE,
      data: {
        available: isAvailable,
        email,
      },
    });
  });

  /**
   * Validate password strength
   * POST /api/auth/validate-password
   */
  static validatePassword = asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body;
    
    const isValid = AuthService.validatePasswordStrength(password);
    
    ResponseUtils.success(res, {
      message: isValid ? MESSAGES.PASSWORD_VALID : MESSAGES.PASSWORD_INVALID,
      data: {
        valid: isValid,
      },
    });
  });

  /**
   * Get active sessions
   * GET /api/auth/sessions
   */
  static getActiveSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    
    const sessions = await AuthService.getActiveSessions(userId);
    
    ResponseUtils.success(res, {
      message: MESSAGES.SESSIONS_RETRIEVED_SUCCESSFULLY,
      data: sessions,
    });
  });

  /**
   * Revoke specific session
   * DELETE /api/auth/sessions/:sessionId
   */
  static revokeSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return ResponseUtils.badRequest(res, 'Session ID is required');
    }
    
    await AuthService.revokeSession(userId, sessionId);
    
    return ResponseUtils.success(res, {
      message: MESSAGES.SESSION_REVOKED_SUCCESSFULLY,
    });
  });

  /**
   * Health check for auth service
   * GET /api/auth/health
   */
  static healthCheck = asyncHandler(async (req: Request, res: Response) => {
    ResponseUtils.success(res, {
      message: 'Auth service is healthy',
      data: {
        service: 'auth',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * Get authentication statistics (Admin only)
   * GET /api/auth/statistics
   */
  static getAuthStatistics = asyncHandler(async (req: Request, res: Response) => {
    // This would typically return auth-related statistics
    // For now, return basic info
    const statistics = {
      totalRegistrations: 0,
      totalLogins: 0,
      activeUsers: 0,
      passwordResets: 0,
      emailVerifications: 0,
    };
    
    ResponseUtils.success(res, {
      message: MESSAGES.STATISTICS_RETRIEVED_SUCCESSFULLY,
      data: statistics,
    });
  });
}

export default AuthController;