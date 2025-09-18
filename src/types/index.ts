import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { IUserDocument } from '@/app/modules/user/user.interface';

// User related types
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  profileImage?: string;
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  authProvider?: string;
  authProviderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
  generatePasswordResetToken(): string;
}

// JWT Payload interface
export interface IJwtPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Extended Request interface for authenticated routes
export interface AuthenticatedRequest extends Request {
  user?: IUserDocument;
  id?: string;
}

// Extend Express Request interface globally
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
    interface User extends IUserDocument {}
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: PaginationMeta;
}

// Error types
export interface IApiError extends Error {
  statusCode: number;
  isOperational: boolean;
}

// File upload types
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
}

export interface FileUploadOptions {
  folder?: string;
  transformation?: any[];
  allowedFormats?: string[];
  maxFileSize?: number;
}

// Database query options
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
  populate?: string;
}

// Email types
export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

// Password reset types
export interface PasswordResetData {
  email: string;
  token: string;
  newPassword: string;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Token pair
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Environment types
export type NodeEnv = 'development' | 'production' | 'test';

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// User roles
export type UserRole = 'user' | 'admin';

// File types
export type AllowedFileType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export default {};