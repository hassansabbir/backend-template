import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import config from '@/config';
import { VALIDATION_RULES } from '@/shared/constants';

export class PasswordUtils {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Failed to hash password');
    }
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(
    candidatePassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(candidatePassword, hashedPassword);
    } catch (error) {
      throw new Error('Failed to compare password');
    }
  }

  /**
   * Validate password (alias for validatePasswordStrength)
   */
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    return this.validatePasswordStrength(password);
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check minimum length
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`);
    }

    // Check maximum length
    if (password.length > VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
      errors.push(`Password must not exceed ${VALIDATION_RULES.PASSWORD_MAX_LENGTH} characters`);
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    // Check for number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    // Check for special character
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    // Check for common patterns
    if (this.hasCommonPatterns(password)) {
      errors.push('Password contains common patterns and is not secure');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for common password patterns
   */
  private static hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      /123456/,
      /password/i,
      /qwerty/i,
      /abc123/i,
      /admin/i,
      /letmein/i,
      /welcome/i,
      /monkey/i,
      /dragon/i,
    ];

    return commonPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length: number = 12): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '@$!%*?&';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Generate password reset token
   */
  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash password reset token
   */
  static hashPasswordResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Check if passwords match
   */
  static passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }

  /**
   * Estimate password strength score (0-100)
   */
  static calculatePasswordStrength(password: string): {
    score: number;
    level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  } {
    let score = 0;

    // Length bonus
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (password.length >= 16) score += 10;

    // Character variety bonus
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[@$!%*?&]/.test(password)) score += 10;

    // Additional complexity bonus
    if (/[^a-zA-Z0-9@$!%*?&]/.test(password)) score += 10;

    // Penalty for common patterns
    if (this.hasCommonPatterns(password)) score -= 20;

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    let level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
    if (score < 20) level = 'Very Weak';
    else if (score < 40) level = 'Weak';
    else if (score < 60) level = 'Fair';
    else if (score < 80) level = 'Good';
    else level = 'Strong';

    return { score, level };
  }
}

export default PasswordUtils;