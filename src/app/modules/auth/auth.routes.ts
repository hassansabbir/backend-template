import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authValidation } from './auth.validation';
import { validateRequest } from '@/middlewares/validateRequest';
import { authenticate, authorize } from '@/middlewares/auth';
import { USER_ROLES } from '@/shared/constants';
import oauthRoutes from './auth.oauth.routes';

const router = Router();

// Public routes (no authentication required)
router.post(
  '/register',
  validateRequest(authValidation.register),
  AuthController.register
);

router.post(
  '/login',
  validateRequest(authValidation.login),
  AuthController.login
);

router.post(
  '/refresh-token',
  validateRequest(authValidation.refreshToken),
  AuthController.refreshToken
);

router.post(
  '/forgot-password',
  validateRequest(authValidation.forgotPassword),
  AuthController.forgotPassword
);

router.post(
  '/reset-password',
  validateRequest(authValidation.resetPassword),
  AuthController.resetPassword
);

router.post(
  '/verify-email',
  validateRequest(authValidation.verifyEmail),
  AuthController.verifyEmail
);

router.post(
  '/resend-verification',
  validateRequest(authValidation.resendVerificationEmail),
  AuthController.resendVerificationEmail
);

router.post(
  '/check-email',
  validateRequest(authValidation.forgotPassword), // Reuse email validation
  AuthController.checkEmailAvailability
);

router.post(
  '/validate-password',
  AuthController.validatePassword
);

router.get('/health', AuthController.healthCheck);

// OAuth routes (public)
router.use('/oauth', oauthRoutes);

// Protected routes (authentication required)
router.use(authenticate); // Apply authentication middleware to all routes below

router.get('/me', AuthController.getCurrentUser);
router.get('/status', AuthController.checkAuthStatus);

router.post(
  '/logout',
  validateRequest(authValidation.logout),
  AuthController.logout
);

router.post(
  '/logout-all',
  validateRequest(authValidation.logoutAllDevices),
  AuthController.logoutAllDevices
);

router.put(
  '/change-password',
  validateRequest(authValidation.changePassword),
  AuthController.changePassword
);

// Session management
router.get(
  '/sessions',
  validateRequest(authValidation.getActiveSessions),
  AuthController.getActiveSessions
);

router.delete(
  '/sessions/:sessionId',
  validateRequest(authValidation.revokeSession),
  AuthController.revokeSession
);

// Admin routes (admin authorization required)
router.get('/statistics', authorize([USER_ROLES.ADMIN]), AuthController.getAuthStatistics);

// Future routes for advanced features
// Uncomment when implementing these features

// Social authentication routes
// router.post(
//   '/social/google',
//   validateRequest(authValidation.socialAuth),
//   AuthController.socialLogin
// );

// router.post(
//   '/social/facebook',
//   validateRequest(authValidation.socialAuth),
//   AuthController.socialLogin
// );

// router.post(
//   '/social/github',
//   validateRequest(authValidation.socialAuth),
//   AuthController.socialLogin
// );

// Two-factor authentication routes
// router.post(
//   '/2fa/enable',
//   validateRequest(authValidation.enableTwoFactor),
//   AuthController.enableTwoFactor
// );

// router.post(
//   '/2fa/verify',
//   validateRequest(authValidation.verifyTwoFactor),
//   AuthController.verifyTwoFactor
// );

// router.post(
//   '/2fa/disable',
//   validateRequest(authValidation.disableTwoFactor),
//   AuthController.disableTwoFactor
// );

// Device management routes
// router.post(
//   '/devices/trust',
//   validateRequest(authValidation.trustDevice),
//   AuthController.trustDevice
// );

// router.delete(
//   '/devices/:deviceId',
//   validateRequest(authValidation.revokeDevice),
//   AuthController.revokeDevice
// );

// Security routes
// router.post(
//   '/security/report',
//   validateRequest(authValidation.reportSuspiciousActivity),
//   AuthController.reportSuspiciousActivity
// );

export { router as authRoutes };
export default router;