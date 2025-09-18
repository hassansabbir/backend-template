import { UserService } from '../user/user.service';
import { User } from '../user/user.model';
import {
  IRegisterData,
  ILoginData,
  IRefreshTokenData,
  IForgotPasswordData,
  IResetPasswordData,
  ILoginResponse,
  IRegisterResponse,
  IRefreshTokenResponse,
  IAuthTokens,
  IForgotPasswordResponse,
  IResetPasswordResponse,
  IVerifyEmailResponse,
} from './auth.interface';
import { IUserDocument } from '../user/user.interface';
import { JWTUtils, PasswordUtils } from '@/utils';
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from '@/shared/errors';
import { StatusCodes } from 'http-status-codes';
import {
  MESSAGES,
} from '@/shared/constants';
import config from '@/config';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(registerData: IRegisterData): Promise<IRegisterResponse> {
    const { name, email, password, profileImage } = registerData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError(MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      profileImage,
    };

    const user = await UserService.createUser(userData);

    // Generate tokens
    const tokens = this.generateTokenPair(user);

    // Save refresh token to user
    await UserService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user,
      tokens,
      message: MESSAGES.REGISTRATION_SUCCESSFUL,
    };
  }

  /**
   * Login user
   */
  static async login(loginData: ILoginData): Promise<ILoginResponse> {
    const { email, password } = loginData;

    // Find user with password
    const user = await User.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(MESSAGES.INVALID_CREDENTIALS);
    }

    // Generate tokens
    const tokens = this.generateTokenPair(user);

    // Save refresh token to user
    await UserService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse as IUserDocument,
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshTokenData: IRefreshTokenData): Promise<IRefreshTokenResponse> {
    const { refreshToken } = refreshTokenData;

    // Verify refresh token
    const decoded = JWTUtils.verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new UnauthorizedError(MESSAGES.INVALID_REFRESH_TOKEN);
    }

    // Find user with refresh token
    const user = await UserService.findUserByRefreshToken(refreshToken);
    if (!user) {
      throw new UnauthorizedError(MESSAGES.INVALID_REFRESH_TOKEN);
    }

    // Generate new tokens
    const tokens = this.generateTokenPair(user);

    // Update refresh token in database
    await UserService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return { tokens };
  }

  /**
   * Logout user
   */
  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Logout from specific device
      const user = await UserService.findUserByRefreshToken(refreshToken);
      if (user && user._id.toString() === userId) {
        await UserService.updateRefreshToken(userId, null);
      }
    } else {
      // Logout from all devices
      await UserService.updateRefreshToken(userId, null);
    }
  }

  /**
   * Logout from all devices
   */
  static async logoutAllDevices(userId: string): Promise<void> {
    await UserService.updateRefreshToken(userId, null);
  }

  /**
   * Forgot password - send reset token
   */
  static async forgotPassword(forgotPasswordData: IForgotPasswordData): Promise<IForgotPasswordResponse> {
    const { email } = forgotPasswordData;

    try {
      const { user, resetToken } = await UserService.setPasswordResetToken(email);

      // In production, send email with reset token
      // await EmailService.sendPasswordResetEmail(user.email, resetToken);

      // For development/testing, return the token (remove in production)
      const response: IForgotPasswordResponse = {
        message: MESSAGES.PASSWORD_RESET_EMAIL_SENT,
      };

      if (config.env === 'development') {
        response.resetToken = resetToken;
      }

      return response;
    } catch (error) {
      // Always return success message for security (don't reveal if email exists)
      return {
        message: MESSAGES.PASSWORD_RESET_EMAIL_SENT,
      };
    }
  }

  /**
   * Reset password using token
   */
  static async resetPassword(resetPasswordData: IResetPasswordData): Promise<IResetPasswordResponse> {
    const { token, password } = resetPasswordData;

    await UserService.resetPassword(token, password);

    return {
      message: MESSAGES.PASSWORD_RESET_SUCCESSFUL,
    };
  }

  /**
   * Change password (authenticated user)
   */
  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    await UserService.changePassword(userId, {
      currentPassword,
      newPassword,
      confirmPassword: newPassword,
    });
  }

  /**
   * Verify email
   */
  static async verifyEmail(token: string): Promise<IVerifyEmailResponse> {
    // Verify email verification token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded || decoded.type !== 'EMAIL_VERIFICATION') {
      throw new BadRequestError(MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }

    // Update user's email verification status
    const user = await UserService.verifyEmail(decoded.userId);

    return {
      user,
      message: MESSAGES.EMAIL_VERIFIED_SUCCESSFULLY,
    };
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await User.findByEmail(email);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new BadRequestError(MESSAGES.EMAIL_ALREADY_VERIFIED);
    }

    // Generate email verification token
    const verificationToken = JWTUtils.generateEmailVerificationToken({
      userId: user._id.toString(),
      email: user.email,
    });

    // In production, send verification email
    // await EmailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: MESSAGES.VERIFICATION_EMAIL_SENT,
    };
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(userId: string): Promise<IUserDocument> {
    return await UserService.getUserById(userId);
  }

  /**
   * Validate access token
   */
  static async validateAccessToken(token: string): Promise<IUserDocument> {
    const decoded = JWTUtils.verifyAccessToken(token);
    if (!decoded) {
      throw new UnauthorizedError(MESSAGES.INVALID_ACCESS_TOKEN);
    }

    const user = await UserService.getUserById(decoded.userId);
    if (!user) {
      throw new UnauthorizedError(MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(token: string): Promise<boolean> {
    try {
      await this.validateAccessToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate token pair (access + refresh)
   */
  public static generateTokenPair(user: IUserDocument): IAuthTokens {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: JWTUtils.generateAccessToken(payload),
      refreshToken: JWTUtils.generateRefreshToken(payload),
    };
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string): string | null {
    return JWTUtils.extractTokenFromHeader(authHeader);
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    return JWTUtils.isTokenExpired(token);
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    return JWTUtils.decodeToken(token);
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(userId: string, email: string): string {
    return JWTUtils.generateEmailVerificationToken({ userId, email });
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(userId: string, email: string): string {
    return JWTUtils.generatePasswordResetToken({ userId, email });
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): boolean {
    return PasswordUtils.validatePassword(password).isValid;
  }

  /**
   * Check if email is available for registration
   */
  static async isEmailAvailable(email: string): Promise<boolean> {
    const result = await UserService.checkEmailAvailability(email);
    return result.available;
  }

  /**
   * Get user by email (for internal use)
   */
  static async getUserByEmail(email: string): Promise<IUserDocument | null> {
    return await UserService.getUserByEmail(email);
  }

  /**
   * Update user's last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
    });
  }

  /**
   * Get user's active sessions (for future implementation)
   */
  static async getActiveSessions(userId: string): Promise<any[]> {
    // This would typically query a sessions table/collection
    // For now, return empty array
    return [];
  }

  /**
   * Revoke specific session (for future implementation)
   */
  static async revokeSession(userId: string, sessionId: string): Promise<void> {
    // This would typically remove a session from sessions table/collection
    // For now, just update refresh token to null
    await UserService.updateRefreshToken(userId, null);
  }
}

export default AuthService;