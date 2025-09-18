import { Document } from 'mongoose';
import { IUserDocument } from '../user/user.interface';

// Authentication request interfaces
export interface IRegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  profileImage?: string;
}

export interface ILoginData {
  email: string;
  password: string;
}

export interface IRefreshTokenData {
  refreshToken: string;
}

export interface IForgotPasswordData {
  email: string;
}

export interface IResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface IChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface IVerifyEmailData {
  token: string;
}

// Authentication response interfaces
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ILoginResponse {
  user: IUserDocument;
  tokens: IAuthTokens;
}

export interface IRegisterResponse {
  user: IUserDocument;
  tokens: IAuthTokens;
  message: string;
}

export interface IRefreshTokenResponse {
  tokens: IAuthTokens;
}

export interface ILogoutResponse {
  message: string;
}

export interface IForgotPasswordResponse {
  message: string;
  resetToken?: string; // Only in development/testing
}

export interface IResetPasswordResponse {
  message: string;
}

export interface IVerifyEmailResponse {
  user: IUserDocument;
  message: string;
}

// Session interfaces
export interface IUserSession {
  userId: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ISessionDocument extends IUserSession, Document {
  _id: string;
}

// Token payload interfaces (extending from types/index.ts)
export interface IAccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

export interface IRefreshTokenPayload {
  userId: string;
  email: string;
  role: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

export interface IPasswordResetTokenPayload {
  userId: string;
  email: string;
  type: 'password_reset';
  iat?: number;
  exp?: number;
}

export interface IEmailVerificationTokenPayload {
  userId: string;
  email: string;
  type: 'email_verification';
  iat?: number;
  exp?: number;
}

// Authentication service options
export interface IAuthServiceOptions {
  includeRefreshToken?: boolean;
  generateTokens?: boolean;
  sendVerificationEmail?: boolean;
  sendWelcomeEmail?: boolean;
}

// Rate limiting interfaces
export interface IRateLimitInfo {
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

export interface ILoginAttempt {
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
}

// Password reset interfaces
export interface IPasswordResetRequest {
  email: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}

// Email verification interfaces
export interface IEmailVerificationRequest {
  userId: string;
  email: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
}

// Social authentication interfaces (for future implementation)
export interface ISocialAuthData {
  provider: 'google' | 'facebook' | 'github';
  providerId: string;
  email: string;
  name: string;
  profileImage?: string;
}

export interface ISocialAuthResponse {
  user: IUserDocument;
  tokens: IAuthTokens;
  isNewUser: boolean;
}

// Two-factor authentication interfaces (for future implementation)
export interface ITwoFactorAuthData {
  userId: string;
  secret: string;
  backupCodes: string[];
  enabled: boolean;
}

export interface ITwoFactorVerificationData {
  userId: string;
  token: string;
}

// Device tracking interfaces
export interface IDeviceInfo {
  userAgent: string;
  ip: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  location?: {
    country: string;
    city: string;
  };
}

export interface IUserDevice {
  userId: string;
  deviceId: string;
  deviceInfo: IDeviceInfo;
  lastUsed: Date;
  trusted: boolean;
}

// Security event interfaces
export interface ISecurityEvent {
  userId: string;
  eventType: 'login' | 'logout' | 'password_change' | 'password_reset' | 'email_change' | 'suspicious_activity';
  deviceInfo: IDeviceInfo;
  timestamp: Date;
  success: boolean;
  details?: Record<string, any>;
}

// All interfaces are exported as named exports above
// No default export needed for interfaces