import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { logger } from './logger';
import config from '@/config';
import { IJwtPayload } from '@/types';
import { TOKEN_TYPES } from '@/shared/constants';

export class JWTUtils {
  /**
   * Generate access token
   */
  static generateAccessToken(payload: Omit<IJwtPayload, 'iat' | 'exp'>): string {
    const options: SignOptions = {
      expiresIn: config.jwt.accessExpiresIn as any,
      issuer: config.project.name,
      audience: `${config.project.name}-users`,
    };
    return jwt.sign(payload, config.jwt.accessSecret, options);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: Omit<IJwtPayload, 'iat' | 'exp'>): string {
    const options: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as any,
      issuer: config.project.name,
      audience: `${config.project.name}-users`,
    };
    return jwt.sign(payload, config.jwt.refreshSecret, options);
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(payload: { userId: string; email: string }): string {
    const options: SignOptions = {
      expiresIn: '1h', // Password reset tokens expire in 1 hour
      issuer: config.project.name,
        audience: `${config.project.name}-users`,
    };
    return jwt.sign(payload, config.jwt.accessSecret, options);
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(payload: { userId: string; email: string }): string {
    const options: SignOptions = {
      expiresIn: '24h', // Email verification tokens expire in 24 hours
      issuer: 'backend-template',
      audience: 'backend-template-users',
    };
    return jwt.sign(payload, config.jwt.accessSecret, options);
  }

  /**
   * Verify token (generic method)
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.accessSecret, {
        issuer: config.project.name,
        audience: `${config.project.name}-users`,
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): IJwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret, {
        issuer: config.project.name,
        audience: `${config.project.name}-users`,
      }) as IJwtPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): IJwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: config.project.name,
        audience: `${config.project.name}-users`,
      }) as IJwtPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Verify password reset token
   */
  static verifyPasswordResetToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret, {
        issuer: config.project.name,
        audience: `${config.project.name}-users`,
      }) as { userId: string; email: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired password reset token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token: string): any {
    return jwt.decode(token);
  }

  /**
   * Get token expiration date
   */
  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        return new Date(decoded.exp * 1000);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1] || null;
  }

  /**
   * Generate token pair (access + refresh)
   */
  static generateTokenPair(payload: Omit<IJwtPayload, 'iat' | 'exp'>): {
    accessToken: string;
    refreshToken: string;
  } {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }
}

export default JWTUtils;