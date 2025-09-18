import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';
import { ResponseUtils } from '@/utils';
import { PassportService } from '@/services/passport.service';
import { ApiError } from '@/shared/errors';
import { logger } from '@/utils';
import { asyncHandler } from '@/middlewares/errorHandler';

const router = Router();

/**
 * @route GET /api/auth/oauth/providers
 * @desc Get available OAuth providers
 * @access Public
 */
router.get('/providers', asyncHandler(async (req, res) => {
  const providers = PassportService.getEnabledStrategies();
  const oauthUrls = PassportService.getOAuthUrls();
  const serviceStatus = PassportService.getServiceStatus();

  return ResponseUtils.success(res, {
    providers,
    urls: oauthUrls,
    status: serviceStatus
  }, 'OAuth providers retrieved successfully');
}));

// Google OAuth Routes
if (PassportService.isStrategyEnabled('google')) {
  /**
   * @route GET /api/auth/google
   * @desc Initiate Google OAuth
   * @access Public
   */
  router.get('/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false 
    })
  );

  /**
   * @route GET /api/auth/google/callback
   * @desc Google OAuth callback
   * @access Public
   */
  router.get('/google/callback',
    passport.authenticate('google', { 
      session: false,
      failureRedirect: process.env.OAUTH_FAILURE_REDIRECT || '/login?error=oauth_failed'
    }),
    asyncHandler(async (req, res) => {
      const oauthUser = req.user as any;
      
      if (!oauthUser) {
        throw new ApiError('OAuth authentication failed', StatusCodes.UNAUTHORIZED);
      }

      // Redirect to frontend with tokens
      const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT || '/dashboard';
      const queryParams = new URLSearchParams({
        access_token: oauthUser.tokens.accessToken,
        refresh_token: oauthUser.tokens.refreshToken,
        is_new_user: oauthUser.isNewUser.toString()
      });

      res.redirect(`${redirectUrl}?${queryParams.toString()}`);
    })
  );
}

// GitHub OAuth Routes
if (PassportService.isStrategyEnabled('github')) {
  /**
   * @route GET /api/auth/github
   * @desc Initiate GitHub OAuth
   * @access Public
   */
  router.get('/github',
    passport.authenticate('github', { 
      scope: ['user:email'],
      session: false 
    })
  );

  /**
   * @route GET /api/auth/github/callback
   * @desc GitHub OAuth callback
   * @access Public
   */
  router.get('/github/callback',
    passport.authenticate('github', { 
      session: false,
      failureRedirect: process.env.OAUTH_FAILURE_REDIRECT || '/login?error=oauth_failed'
    }),
    asyncHandler(async (req, res) => {
      const oauthUser = req.user as any;
      
      if (!oauthUser) {
        throw new ApiError('OAuth authentication failed', StatusCodes.UNAUTHORIZED);
      }

      const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT || '/dashboard';
      const queryParams = new URLSearchParams({
        access_token: oauthUser.tokens.accessToken,
        refresh_token: oauthUser.tokens.refreshToken,
        is_new_user: oauthUser.isNewUser.toString()
      });

      res.redirect(`${redirectUrl}?${queryParams.toString()}`);
    })
  );
}

// Facebook OAuth Routes
if (PassportService.isStrategyEnabled('facebook')) {
  /**
   * @route GET /api/auth/facebook
   * @desc Initiate Facebook OAuth
   * @access Public
   */
  router.get('/facebook',
    passport.authenticate('facebook', { 
      scope: ['email'],
      session: false 
    })
  );

  /**
   * @route GET /api/auth/facebook/callback
   * @desc Facebook OAuth callback
   * @access Public
   */
  router.get('/facebook/callback',
    passport.authenticate('facebook', { 
      session: false,
      failureRedirect: process.env.OAUTH_FAILURE_REDIRECT || '/login?error=oauth_failed'
    }),
    asyncHandler(async (req, res) => {
      const oauthUser = req.user as any;
      
      if (!oauthUser) {
        throw new ApiError('OAuth authentication failed', StatusCodes.UNAUTHORIZED);
      }

      const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT || '/dashboard';
      const queryParams = new URLSearchParams({
        access_token: oauthUser.tokens.accessToken,
        refresh_token: oauthUser.tokens.refreshToken,
        is_new_user: oauthUser.isNewUser.toString()
      });

      res.redirect(`${redirectUrl}?${queryParams.toString()}`);
    })
  );
}

// Twitter OAuth Routes
if (PassportService.isStrategyEnabled('twitter')) {
  /**
   * @route GET /api/auth/twitter
   * @desc Initiate Twitter OAuth
   * @access Public
   */
  router.get('/twitter',
    passport.authenticate('twitter', { session: false })
  );

  /**
   * @route GET /api/auth/twitter/callback
   * @desc Twitter OAuth callback
   * @access Public
   */
  router.get('/twitter/callback',
    passport.authenticate('twitter', { 
      session: false,
      failureRedirect: process.env.OAUTH_FAILURE_REDIRECT || '/login?error=oauth_failed'
    }),
    asyncHandler(async (req, res) => {
      const oauthUser = req.user as any;
      
      if (!oauthUser) {
        throw new ApiError('OAuth authentication failed', StatusCodes.UNAUTHORIZED);
      }

      const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT || '/dashboard';
      const queryParams = new URLSearchParams({
        access_token: oauthUser.tokens.accessToken,
        refresh_token: oauthUser.tokens.refreshToken,
        is_new_user: oauthUser.isNewUser.toString()
      });

      res.redirect(`${redirectUrl}?${queryParams.toString()}`);
    })
  );
}

// LinkedIn OAuth Routes
if (PassportService.isStrategyEnabled('linkedin')) {
  /**
   * @route GET /api/auth/linkedin
   * @desc Initiate LinkedIn OAuth
   * @access Public
   */
  router.get('/linkedin',
    passport.authenticate('linkedin', { 
      scope: ['r_emailaddress', 'r_liteprofile'],
      session: false 
    })
  );

  /**
   * @route GET /api/auth/linkedin/callback
   * @desc LinkedIn OAuth callback
   * @access Public
   */
  router.get('/linkedin/callback',
    passport.authenticate('linkedin', { 
      session: false,
      failureRedirect: process.env.OAUTH_FAILURE_REDIRECT || '/login?error=oauth_failed'
    }),
    asyncHandler(async (req, res) => {
      const oauthUser = req.user as any;
      
      if (!oauthUser) {
        throw new ApiError('OAuth authentication failed', StatusCodes.UNAUTHORIZED);
      }

      const redirectUrl = process.env.OAUTH_SUCCESS_REDIRECT || '/dashboard';
      const queryParams = new URLSearchParams({
        access_token: oauthUser.tokens.accessToken,
        refresh_token: oauthUser.tokens.refreshToken,
        is_new_user: oauthUser.isNewUser.toString()
      });

      res.redirect(`${redirectUrl}?${queryParams.toString()}`);
    })
  );
}

/**
 * @route POST /api/auth/oauth/link
 * @desc Link OAuth account to existing user
 * @access Private
 */
router.post('/link', asyncHandler(async (req, res) => {
  const { provider, providerId } = req.body;
  const userId = req.user?.id; // Assuming auth middleware sets req.user

  if (!userId) {
    throw new ApiError('Authentication required', StatusCodes.UNAUTHORIZED);
  }

  if (!provider || !providerId) {
    throw new ApiError('Provider and provider ID are required', StatusCodes.BAD_REQUEST);
  }

  await PassportService.linkOAuthAccount(userId, provider, providerId);

  return ResponseUtils.success(res, null, 'OAuth account linked successfully');
}));

/**
 * @route DELETE /api/auth/oauth/unlink
 * @desc Unlink OAuth account from user
 * @access Private
 */
router.delete('/unlink', asyncHandler(async (req, res) => {
  const userId = req.user?.id; // Assuming auth middleware sets req.user

  if (!userId) {
    throw new ApiError('Authentication required', StatusCodes.UNAUTHORIZED);
  }

  await PassportService.unlinkOAuthAccount(userId);

  return ResponseUtils.success(res, null, 'OAuth account unlinked successfully');
}));

/**
 * @route GET /api/auth/oauth/status
 * @desc Get OAuth service status
 * @access Public
 */
router.get('/status', asyncHandler(async (req, res) => {
  const status = PassportService.getServiceStatus();
  
  return ResponseUtils.success(res, status, 'OAuth service status retrieved');
}));

/**
 * @route POST /api/auth/oauth/token
 * @desc Exchange OAuth code for tokens (for mobile/SPA)
 * @access Public
 */
router.post('/token', asyncHandler(async (req, res) => {
  const { provider, code, redirectUri } = req.body;

  if (!provider || !code) {
    throw new ApiError('Provider and code are required', StatusCodes.BAD_REQUEST);
  }

  if (!PassportService.isStrategyEnabled(provider)) {
    throw new ApiError(`Provider '${provider}' is not enabled`, StatusCodes.BAD_REQUEST);
  }

  // This would typically involve exchanging the code for an access token
  // and then using that token to get user info from the OAuth provider
  // For now, we'll return a placeholder response
  
  logger.info('OAuth token exchange requested', { provider, redirectUri });
  
  return ResponseUtils.success(res, {
    message: 'OAuth token exchange endpoint - implementation depends on specific OAuth flow'
  }, 'OAuth token exchange initiated');
}));

export default router;