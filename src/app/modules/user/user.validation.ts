import { z } from 'zod';
import { VALIDATION_RULES, USER_ROLES } from '@/shared/constants';

// Base user validation schemas
const nameSchema = z
  .string()
  .min(VALIDATION_RULES.NAME_MIN_LENGTH, {
    message: `Name must be at least ${VALIDATION_RULES.NAME_MIN_LENGTH} characters long`,
  })
  .max(VALIDATION_RULES.NAME_MAX_LENGTH, {
    message: `Name cannot exceed ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`,
  })
  .trim();

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

const roleSchema = z
  .enum([USER_ROLES.USER, USER_ROLES.ADMIN] as const)
  .default(USER_ROLES.USER);

const profileImageSchema = z
  .string()
  .url({ message: 'Profile image must be a valid URL' })
  .optional();

// Create user validation schema
export const createUserSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: roleSchema.optional(),
    profileImage: profileImageSchema,
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// Update user validation schema
export const updateUserSchema = z.object({
  body: z.object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    role: roleSchema.optional(),
    profileImage: profileImageSchema,
    isEmailVerified: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid user ID format',
    }),
  }),
});

// Update profile validation schema
export const updateProfileSchema = z.object({
  body: z.object({
    name: nameSchema.optional(),
    profileImage: profileImageSchema,
  }),
});

// Change password validation schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, { message: 'Current password is required' }),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }),
});

// Get user by ID validation schema
export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid user ID format',
    }),
  }),
});

// Delete user validation schema
export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, {
      message: 'Invalid user ID format',
    }),
  }),
});

// Get users query validation schema
export const getUsersQuerySchema = z.object({
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
      .refine((val) => val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100',
      }),
    search: z.string().optional(),
    role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN] as const).optional(),
    isEmailVerified: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'true') return true;
        if (val === 'false') return false;
        return undefined;
      }),
    sortBy: z
      .enum(['name', 'email', 'createdAt', 'updatedAt'] as const)
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc'] as const).default('desc'),
  }),
});

// Upload avatar validation schema
export const uploadAvatarSchema = z.object({
  file: z.object({
    mimetype: z.string().refine(
      (mimetype) => VALIDATION_RULES.ALLOWED_IMAGE_TYPES.includes(mimetype as any),
      { message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' }
    ),
    size: z.number().max(VALIDATION_RULES.MAX_FILE_SIZE, {
      message: `File size cannot exceed ${VALIDATION_RULES.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    }),
  }),
});

// Email validation schema (for checking email availability)
export const checkEmailSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

// Bulk operations validation schema
export const bulkDeleteUsersSchema = z.object({
  body: z.object({
    userIds: z
      .array(
        z.string().regex(/^[0-9a-fA-F]{24}$/, {
          message: 'Invalid user ID format',
        })
      )
      .min(1, { message: 'At least one user ID is required' })
      .max(50, { message: 'Cannot delete more than 50 users at once' }),
  }),
});

// User statistics query validation schema
export const getUserStatsSchema = z.object({
  query: z.object({
    startDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .refine((val) => !val || !isNaN(val.getTime()), {
        message: 'Invalid start date format',
      }),
    endDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .refine((val) => !val || !isNaN(val.getTime()), {
        message: 'Invalid end date format',
      }),
  }),
});

// Export all validation schemas
export const userValidation = {
  createUser: createUserSchema,
  updateUser: updateUserSchema,
  updateProfile: updateProfileSchema,
  changePassword: changePasswordSchema,
  getUserById: getUserByIdSchema,
  deleteUser: deleteUserSchema,
  getUsersQuery: getUsersQuerySchema,
  uploadAvatar: uploadAvatarSchema,
  checkEmail: checkEmailSchema,
  bulkDeleteUsers: bulkDeleteUsersSchema,
  getUserStats: getUserStatsSchema,
};

export default userValidation;