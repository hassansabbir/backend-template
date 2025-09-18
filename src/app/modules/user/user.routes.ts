import { Router } from 'express';
import { UserController } from './user.controller';
import { userValidation } from './user.validation';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate, authorize } from '@/middlewares/auth';
import { uploadAvatar } from '@/middlewares/upload';
import { USER_ROLES } from '@/shared/constants';

const router = Router();

// Public routes (no authentication required)
router.post(
  '/check-email',
  validateRequest(userValidation.checkEmail),
  UserController.checkEmailAvailability
);

// Protected routes (authentication required)
router.use(authenticate); // Apply authentication middleware to all routes below

// Current user profile routes
router.get('/profile', UserController.getCurrentUser);
router.put(
  '/profile',
  validateRequest(userValidation.updateProfile),
  UserController.updateProfile
);
router.delete('/profile', UserController.deleteCurrentUser);

// Password management
router.put(
  '/change-password',
  validateRequest(userValidation.changePassword),
  UserController.changePassword
);

// Avatar management
router.post(
  '/avatar',
  uploadAvatar,
  // validateRequest(userValidation.uploadAvatar), // Uncomment when file validation is needed
  UserController.uploadAvatar
);
router.delete('/avatar', UserController.removeAvatar);

// Admin-only routes - User management
router.post(
  '/',
  authorize([USER_ROLES.ADMIN]),
  validateRequest(userValidation.createUser),
  UserController.createUser
);

router.get(
  '/',
  authorize([USER_ROLES.ADMIN]),
  validateRequest(userValidation.getUsersQuery),
  UserController.getUsers
);

router.get(
  '/statistics',
  authorize([USER_ROLES.ADMIN]),
  validateRequest(userValidation.getUserStats),
  UserController.getUserStatistics
);

router.get('/active', authorize([USER_ROLES.ADMIN]), UserController.getActiveUsers);

router.get(
  '/role/:role',
  authorize([USER_ROLES.ADMIN]),
  UserController.getUsersByRole
);

router.get(
  '/:id',
  authorize([USER_ROLES.ADMIN]),
  validateRequest(userValidation.getUserById),
  UserController.getUserById
);

router.put(
  '/:id',
  authorize([USER_ROLES.ADMIN]),
  validateRequest(userValidation.updateUser),
  UserController.updateUser
);

router.delete(
  '/:id',
  authorize([USER_ROLES.ADMIN]),
  validateRequest(userValidation.deleteUser),
  UserController.deleteUser
);

router.put(
  '/:id/verify-email',
  authorize([USER_ROLES.ADMIN]),
  validateRequest(userValidation.getUserById),
  UserController.verifyUserEmail
);

// Bulk operations (Admin only)
router.delete(
  '/bulk',
  authorize([USER_ROLES.ADMIN]),
  validateRequest(userValidation.bulkDeleteUsers),
  UserController.bulkDeleteUsers
);

export { router as userRoutes };
export default router;