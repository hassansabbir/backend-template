import config from '@/config';

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

// JWT Token Types
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification',
} as const;

// API Response Messages
export const MESSAGES = {
  // Success messages
  SUCCESS: 'Operation completed successfully',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  PASSWORD_RESET_EMAIL_SENT: 'Password reset email sent successfully',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  EMAIL_VERIFIED: 'Email verified successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  IMAGE_UPLOADED: 'Image uploaded successfully',
  AVATAR_UPLOADED_SUCCESSFULLY: 'Avatar uploaded successfully',
  AVATAR_REMOVED_SUCCESSFULLY: 'Avatar removed successfully',
  EMAIL_VERIFIED_SUCCESSFULLY: 'Email verified successfully',
  ACTIVE_USERS_RETRIEVED_SUCCESSFULLY: 'Active users retrieved successfully',
  USERS_RETRIEVED_SUCCESSFULLY: 'Users retrieved successfully',
  EMAIL_NOT_AVAILABLE: 'Email is not available',
  EMAIL_AVAILABLE: 'Email is available',
  ACCOUNT_DELETED_SUCCESSFULLY: 'Account deleted successfully',
  STATISTICS_RETRIEVED_SUCCESSFULLY: 'Statistics retrieved successfully',
  LOGIN_SUCCESSFUL: 'Login successful',
  TOKEN_REFRESHED_SUCCESSFULLY: 'Token refreshed successfully',
  LOGOUT_SUCCESSFUL: 'Logout successful',
  LOGOUT_ALL_SUCCESSFUL: 'Logged out from all devices successfully',
  PASSWORD_CHANGED_SUCCESSFULLY: 'Password changed successfully',
  AUTHENTICATED: 'User is authenticated',
  PASSWORD_VALID: 'Password is valid',
  PASSWORD_INVALID: 'Password is invalid',
  SESSIONS_RETRIEVED_SUCCESSFULLY: 'Sessions retrieved successfully',
  SESSION_REVOKED_SUCCESSFULLY: 'Session revoked successfully',
  REGISTRATION_SUCCESSFUL: 'Registration successful',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  PASSWORD_RESET_SUCCESSFUL: 'Password reset successful',
  EMAIL_ALREADY_VERIFIED: 'Email is already verified',
  VERIFICATION_EMAIL_SENT: 'Verification email sent successfully',
  PROFILE_UPDATED_SUCCESSFULLY: 'Profile updated successfully',
  USER_UPDATED_SUCCESSFULLY: 'User updated successfully',
  USER_DELETED_SUCCESSFULLY: 'User deleted successfully',
  USER_RETRIEVED_SUCCESSFULLY: 'User retrieved successfully',
  USER_CREATED_SUCCESSFULLY: 'User created successfully',
  
  // Error messages
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Unauthorized access',
  AUTHENTICATION_REQUIRED: 'Authentication required',
  AUTHENTICATION_FAILED: 'Authentication failed',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  API_KEY_REQUIRED: 'API key required',
  INVALID_API_KEY: 'Invalid API key',
  EMAIL_VERIFICATION_REQUIRED: 'Email verification required',
  ACCESS_DENIED: 'Access denied',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_TOKEN_FORMAT: 'Invalid token format',
  INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token',
  INVALID_CURRENT_PASSWORD: 'Current password is incorrect',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_ACCESS_TOKEN: 'Invalid access token',
  ACCESS_TOKEN_REQUIRED: 'Access token required',
  ACCESS_TOKEN_EXPIRED: 'Access token expired',
  ACCESS_TOKEN_NOT_ACTIVE: 'Access token not active yet',
  INVALID_PASSWORD_RESET_TOKEN: 'Invalid or expired password reset token',
  PASSWORD_MISMATCH: 'Passwords do not match',
  WEAK_PASSWORD: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  FILE_REQUIRED: 'File is required',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  DATABASE_CONNECTION_ERROR: 'Database connection error',
  EMAIL_SEND_ERROR: 'Failed to send email',
  CLOUDINARY_UPLOAD_ERROR: 'Failed to upload image to Cloudinary',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const PAGINATION_DEFAULTS = PAGINATION;

// Cache Keys
export const CACHE_KEYS = {
  USER_PREFIX: 'user:',
  TOKEN_BLACKLIST_PREFIX: 'blacklist:',
  RATE_LIMIT_PREFIX: 'rate_limit:',
} as const;

// Time Constants (in milliseconds)
export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// Cloudinary Folders
export const CLOUDINARY_FOLDERS = {
  PROFILE_IMAGES: `${config.project.name}/profile-images`,
  DOCUMENTS: `${config.project.name}/documents`,
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  PASSWORD_RESET: 'password-reset',
  EMAIL_VERIFICATION: 'email-verification',
  WELCOME: 'welcome',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/upload-avatar',
    CHANGE_PASSWORD: '/users/change-password',
  },
} as const;

// Regular Expressions
export const REGEX = {
  MONGODB_OBJECT_ID: /^[0-9a-fA-F]{24}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  PHONE_NUMBER: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/.+/,
} as const;

export default {
  HTTP_STATUS,
  USER_ROLES,
  TOKEN_TYPES,
  MESSAGES,
  VALIDATION_RULES,
  PAGINATION,
  CACHE_KEYS,
  TIME,
  CLOUDINARY_FOLDERS,
  EMAIL_TEMPLATES,
  API_ENDPOINTS,
  REGEX,
};