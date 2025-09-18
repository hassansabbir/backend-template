import { z } from 'zod';
import { VALIDATION_RULES } from '@/shared/constants';

// Base validation schemas
const emailSchema = z
  .string()
  .email({ message: 'Please provide a valid email address' })
  .max(VALIDATION_RULES.EMAIL_MAX_LENGTH, {
    message: `Email cannot exceed ${VALIDATION_RULES.EMAIL_MAX_LENGTH} characters`,
  })
  .toLowerCase()
  .trim();

const passwordSchema = z
  .string()
  .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, {
    message: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`,
  })
  .max(VALIDATION_RULES.PASSWORD_MAX_LENGTH, {
    message: `Password cannot exceed ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`,
  })
  .regex(VALIDATION_RULES.PASSWORD_REGEX, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  });

const nameSchema = z
  .string()
  .min(VALIDATION_RULES.NAME_MIN_LENGTH, {
    message: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters long`,
  })
  .max(VALIDATION_RULES.NAME_MAX_LENGTH, {
    message: `Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
  })
  .trim();

const tokenSchema = z
  .string()
  .min(1, { message: 'Token is required' })
  .max(500, { message: 'Token is too long' });

// Register validation schema
export const registerSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
    profileImage: z
      .string()
      .url({ message: 'Profile image must be a valid URL' })
      .optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Login validation schema
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, { message: 'Password is required' }),
  }),
});

// Refresh token validation schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
  }),
});

// Forgot password validation schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Reset password validation schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: tokenSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Change password validation schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, { message: 'Confirm password is required' }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }),
});

// Verify email validation schema
export const verifyEmailSchema = z.object({
  body: z.object({
    token: tokenSchema,
  }),
});

// Resend verification email validation schema
export const resendVerificationEmailSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Logout validation schema
export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(), // Optional for logout all devices
  }),
});

// Logout all devices validation schema
export const logoutAllDevicesSchema = z.object({
  body: z.object({}), // No body required, user info comes from auth middleware
});

// Social auth validation schema (for future implementation)
export const socialAuthSchema = z.object({
  body: z.object({
    provider: z.enum(['google', 'facebook', 'github'], {
      message: 'Invalid social provider',
    }),
    accessToken: z.string().min(1, { message: 'Access token is required' }),
    idToken: z.string().optional(),
  }),
});

// Two-factor authentication validation schemas (for future implementation)
export const enableTwoFactorSchema = z.object({
  body: z.object({
    password: z.string().min(1, { message: 'Password is required' }),
  }),
});

export const verifyTwoFactorSchema = z.object({
  body: z.object({
    token: z
      .string()
      .length(6, { message: 'Two-factor token must be 6 digits' })
      .regex(/^\d{6}$/, { message: 'Two-factor token must contain only digits' }),
  }),
});

export const disableTwoFactorSchema = z.object({
  body: z.object({
    password: z.string().min(1, { message: 'Password is required' }),
    token: z
      .string()
      .length(6, { message: 'Two-factor token must be 6 digits' })
      .regex(/^\d{6}$/, { message: 'Two-factor token must contain only digits' }),
  }),
});

// Device management validation schemas
export const trustDeviceSchema = z.object({
  body: z.object({
    deviceId: z.string().min(1, { message: 'Device ID is required' }),
  }),
});

export const revokeDeviceSchema = z.object({
  params: z.object({
    deviceId: z.string().min(1, { message: 'Device ID is required' }),
  }),
});

// Security validation schemas
export const reportSuspiciousActivitySchema = z.object({
  body: z.object({
    activityType: z.enum(['unauthorized_login', 'suspicious_location', 'unusual_activity'], {
      message: 'Invalid activity type',
    }),
    description: z
      .string()
      .min(10, { message: 'Description must be at least 10 characters long' })
      .max(500, { message: 'Description cannot exceed 500 characters' })
      .optional(),
  }),
});

// Session management validation schemas
export const getActiveSessionsSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: 'Page must be a positive number' }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val > 0 && val <= 50, {
        message: 'Limit must be between 1 and 50',
      }),
  }),
});

export const revokeSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, { message: 'Session ID is required' }),
  }),
});

// Export all validation schemas
export const authValidation = {
  register: registerSchema,
  login: loginSchema,
  refreshToken: refreshTokenSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  changePassword: changePasswordSchema,
  verifyEmail: verifyEmailSchema,
  resendVerificationEmail: resendVerificationEmailSchema,
  logout: logoutSchema,
  logoutAllDevices: logoutAllDevicesSchema,
  socialAuth: socialAuthSchema,
  enableTwoFactor: enableTwoFactorSchema,
  verifyTwoFactor: verifyTwoFactorSchema,
  disableTwoFactor: disableTwoFactorSchema,
  trustDevice: trustDeviceSchema,
  revokeDevice: revokeDeviceSchema,
  reportSuspiciousActivity: reportSuspiciousActivitySchema,
  getActiveSessions: getActiveSessionsSchema,
  revokeSession: revokeSessionSchema,
};

export default authValidation;