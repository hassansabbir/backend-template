import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { StatusCodes } from 'http-status-codes';
import { logger } from '@/utils';
import { ApiError } from '@/shared/errors';
import { UserService } from '@/app/modules/user/user.service';
import { AuthService } from '@/app/modules/auth/auth.service';
import { IUserDocument } from '@/app/modules/user/user.interface';
import config from '@/config';

export interface OAuthProfile {
  id: string;
  provider: string;
  displayName: string;
  name?: {
    familyName?: string;
    givenName?: string;
  };
  emails?: Array<{
    value: string;
    verified?: boolean;
  }>;
  photos?: Array<{
    value: string;
  }>;
  username?: string;
  profileUrl?: string;
}

export interface OAuthUser {
  user: IUserDocument;
  isNewUser: boolean;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class PassportService {
  private static isInitialized = false;
  private static enabledStrategies: string[] = [];

  /**
   * Initialize Passport with configured strategies
   */
  public static initialize(): void {
    if (this.isInitialized) {
      logger.warn('Passport service already initialized');
      return;
    }

    // Configure serialization
    this.configureSerializers();

    // Initialize strategies based on environment configuration
    this.initializeStrategies();

    this.isInitialized = true;
    logger.info('Passport service initialized', {
      enabledStrategies: this.enabledStrategies
    });
  }

  /**
   * Configure passport serializers
   */
  private static configureSerializers(): void {
    passport.serializeUser((user: any, done) => {
      done(null, user._id || user.id);
    });

    passport.deserializeUser(async (id: string, done) => {
      try {
        const user = await UserService.getUserById(id);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  /**
   * Initialize OAuth strategies based on configuration
   */
  private static initializeStrategies(): void {
    // Google OAuth Strategy
    if (this.isGoogleConfigured()) {
      this.initializeGoogleStrategy();
      this.enabledStrategies.push('google');
    }

    // GitHub OAuth Strategy
    if (this.isGitHubConfigured()) {
      this.initializeGitHubStrategy();
      this.enabledStrategies.push('github');
    }

    // Facebook OAuth Strategy
    if (this.isFacebookConfigured()) {
      this.initializeFacebookStrategy();
      this.enabledStrategies.push('facebook');
    }

    // Twitter OAuth Strategy
    if (this.isTwitterConfigured()) {
      this.initializeTwitterStrategy();
      this.enabledStrategies.push('twitter');
    }

    // LinkedIn OAuth Strategy
    if (this.isLinkedInConfigured()) {
      this.initializeLinkedInStrategy();
      this.enabledStrategies.push('linkedin');
    }

    if (this.enabledStrategies.length === 0) {
      logger.warn('No OAuth strategies configured. Social login will not be available.');
    }
  }

  /**
   * Initialize Google OAuth Strategy
   */
  private static initializeGoogleStrategy(): void {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
          scope: ['profile', 'email']
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const oauthUser = await this.handleOAuthCallback({
              id: profile.id,
              provider: 'google',
              displayName: profile.displayName,
              name: profile.name,
              emails: profile.emails,
              photos: profile.photos,
              profileUrl: profile.profileUrl
            });
            done(null, oauthUser);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );
  }

  /**
   * Initialize GitHub OAuth Strategy
   */
  private static initializeGitHubStrategy(): void {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback',
          scope: ['user:email']
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const oauthUser = await this.handleOAuthCallback({
              id: profile.id,
              provider: 'github',
              displayName: profile.displayName || profile.username,
              username: profile.username,
              emails: profile.emails,
              photos: profile.photos,
              profileUrl: profile.profileUrl
            });
            done(null, oauthUser);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );
  }

  /**
   * Initialize Facebook OAuth Strategy
   */
  private static initializeFacebookStrategy(): void {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID!,
          clientSecret: process.env.FACEBOOK_APP_SECRET!,
          callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/facebook/callback',
          profileFields: ['id', 'displayName', 'name', 'emails', 'photos']
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const oauthUser = await this.handleOAuthCallback({
              id: profile.id,
              provider: 'facebook',
              displayName: profile.displayName,
              name: profile.name,
              emails: profile.emails,
              photos: profile.photos,
              profileUrl: profile.profileUrl
            });
            done(null, oauthUser);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );
  }

  /**
   * Initialize Twitter OAuth Strategy
   */
  private static initializeTwitterStrategy(): void {
    passport.use(
      new TwitterStrategy(
        {
          consumerKey: process.env.TWITTER_CONSUMER_KEY!,
          consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
          callbackURL: process.env.TWITTER_CALLBACK_URL || '/api/auth/twitter/callback',
          includeEmail: true
        },
        async (token: string, tokenSecret: string, profile: any, done: any) => {
          try {
            const oauthUser = await this.handleOAuthCallback({
              id: profile.id,
              provider: 'twitter',
              displayName: profile.displayName,
              username: profile.username,
              emails: profile.emails,
              photos: profile.photos,
              profileUrl: profile.profileUrl
            });
            done(null, oauthUser);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );
  }

  /**
   * Initialize LinkedIn OAuth Strategy
   */
  private static initializeLinkedInStrategy(): void {
    passport.use(
      new LinkedInStrategy(
        {
          clientID: process.env.LINKEDIN_CLIENT_ID!,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
          callbackURL: process.env.LINKEDIN_CALLBACK_URL || '/api/auth/linkedin/callback',
          scope: ['r_emailaddress', 'r_liteprofile']
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const oauthUser = await this.handleOAuthCallback({
              id: profile.id,
              provider: 'linkedin',
              displayName: profile.displayName,
              name: profile.name,
              emails: profile.emails,
              photos: profile.photos,
              profileUrl: profile.profileUrl
            });
            done(null, oauthUser);
          } catch (error) {
            done(error, null);
          }
        }
      )
    );
  }

  /**
   * Handle OAuth callback and create/find user
   */
  private static async handleOAuthCallback(profile: OAuthProfile): Promise<OAuthUser> {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        throw new ApiError(
          'Email is required for OAuth authentication',
          StatusCodes.BAD_REQUEST
        );
      }

      // Check if user exists with this email
      let user = await UserService.getUserByEmail(email);
      let isNewUser = false;

      if (!user) {
        // Create new user
        const userData = {
          name: profile.displayName || profile.name?.givenName || 'User',
          email,
          profileImage: profile.photos?.[0]?.value,
          isEmailVerified: true, // OAuth emails are considered verified
          authProvider: profile.provider,
          authProviderId: profile.id
        };

        user = await UserService.createUser(userData);
        isNewUser = true;
        
        logger.info(`New user created via ${profile.provider} OAuth`, {
          userId: user._id,
          email,
          provider: profile.provider
        });
      } else {
        // Update existing user with OAuth info if not already set
        if (!user.authProvider || !user.authProviderId) {
          await UserService.updateUser(user._id.toString(), {
            authProvider: profile.provider,
            authProviderId: profile.id,
            isEmailVerified: true
          });
        }
        
        logger.info(`Existing user logged in via ${profile.provider} OAuth`, {
          userId: user._id,
          email,
          provider: profile.provider
        });
      }

      // Generate JWT tokens
      const tokens = AuthService.generateTokenPair(user);

      // Save refresh token
      await UserService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

      return {
        user,
        isNewUser,
        tokens
      };
    } catch (error) {
      logger.error('OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Get enabled OAuth strategies
   */
  public static getEnabledStrategies(): string[] {
    return [...this.enabledStrategies];
  }

  /**
   * Check if a specific strategy is enabled
   */
  public static isStrategyEnabled(strategy: string): boolean {
    return this.enabledStrategies.includes(strategy);
  }

  /**
   * Get OAuth login URLs
   */
  public static getOAuthUrls(): Record<string, string> {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const urls: Record<string, string> = {};

    this.enabledStrategies.forEach(strategy => {
      urls[strategy] = `${baseUrl}/api/auth/${strategy}`;
    });

    return urls;
  }

  /**
   * Link OAuth account to existing user
   */
  public static async linkOAuthAccount(
    userId: string,
    provider: string,
    providerId: string
  ): Promise<void> {
    try {
      await UserService.updateUser(userId, {
        authProvider: provider,
        authProviderId: providerId
      });
      
      logger.info('OAuth account linked', {
        userId,
        provider,
        providerId
      });
    } catch (error) {
      logger.error('Failed to link OAuth account:', error);
      throw new ApiError(
        'Failed to link OAuth account',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Unlink OAuth account from user
   */
  public static async unlinkOAuthAccount(userId: string): Promise<void> {
    try {
      await UserService.updateUser(userId, {
        authProvider: undefined,
        authProviderId: undefined
      });
      
      logger.info('OAuth account unlinked', { userId });
    } catch (error) {
      logger.error('Failed to unlink OAuth account:', error);
      throw new ApiError(
        'Failed to unlink OAuth account',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Configuration check methods
  private static isGoogleConfigured(): boolean {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }

  private static isGitHubConfigured(): boolean {
    return !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  }

  private static isFacebookConfigured(): boolean {
    return !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
  }

  private static isTwitterConfigured(): boolean {
    return !!(process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET);
  }

  private static isLinkedInConfigured(): boolean {
    return !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
  }

  /**
   * Get service status
   */
  public static getServiceStatus(): {
    isInitialized: boolean;
    enabledStrategies: string[];
    availableStrategies: string[];
    configurationStatus: Record<string, boolean>;
  } {
    return {
      isInitialized: this.isInitialized,
      enabledStrategies: this.enabledStrategies,
      availableStrategies: ['google', 'github', 'facebook', 'twitter', 'linkedin'],
      configurationStatus: {
        google: this.isGoogleConfigured(),
        github: this.isGitHubConfigured(),
        facebook: this.isFacebookConfigured(),
        twitter: this.isTwitterConfigured(),
        linkedin: this.isLinkedInConfigured()
      }
    };
  }
}

// Export passport instance for middleware usage
export { passport };
export default PassportService;