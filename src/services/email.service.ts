import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '@/shared/errors';
import { logger } from '@/utils';
import { MESSAGES } from '@/shared/constants';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
  template?: string;
  templateData?: Record<string, any>;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export class EmailService {
  private transporter!: Transporter;
  private config: EmailConfig;
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
    };

    this.validateConfig();
    this.createTransporter();
    this.loadTemplates();
  }

  /**
   * Validate email configuration
   */
  private validateConfig(): void {
    if (!this.config.auth.user || !this.config.auth.pass) {
   throw new ApiError(
        'Email configuration is incomplete. Please check SMTP_USER and SMTP_PASS environment variables.',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create nodemailer transporter
   */
  private createTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
        tls: {
          rejectUnauthorized: false,
        },
      });

      logger.info('Email transporter created successfully');
    } catch (error) {
      logger.error('Failed to create email transporter:', error);
      throw new ApiError(
        'Failed to initialize email service',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Load email templates
   */
  private loadTemplates(): void {
    // Welcome email template
    this.templates.set('welcome', {
      subject: 'Welcome to {{appName}}!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Welcome to {{appName}}!</h1>
          <p>Hi {{name}},</p>
          <p>Thank you for joining {{appName}}. We're excited to have you on board!</p>
          <p>To get started, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>If you didn't create this account, please ignore this email.</p>
          <p>Best regards,<br>The {{appName}} Team</p>
        </div>
      `,
      text: 'Welcome to {{appName}}! Please verify your email at: {{verificationUrl}}'
    });

    // Email verification template
    this.templates.set('email-verification', {
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Email Verification</h1>
          <p>Hi {{name}},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{verificationUrl}}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
          </div>
          <p>This link will expire in {{expirationTime}}.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
          <p>Best regards,<br>The {{appName}} Team</p>
        </div>
      `,
      text: 'Please verify your email at: {{verificationUrl}}'
    });

    // Password reset template
    this.templates.set('password-reset', {
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Password Reset</h1>
          <p>Hi {{name}},</p>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in {{expirationTime}}.</p>
          <p>If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
          <p>Best regards,<br>The {{appName}} Team</p>
        </div>
      `,
      text: 'Reset your password at: {{resetUrl}}'
    });

    // Password changed notification
    this.templates.set('password-changed', {
      subject: 'Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; text-align: center;">Password Changed</h1>
          <p>Hi {{name}},</p>
          <p>Your password has been successfully changed on {{date}}.</p>
          <p>If you didn't make this change, please contact our support team immediately.</p>
          <p>Best regards,<br>The {{appName}} Team</p>
        </div>
      `,
      text: 'Your password has been changed successfully on {{date}}.'
    });

    // Account locked notification
    this.templates.set('account-locked', {
      subject: 'Account Security Alert',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc3545; text-align: center;">Account Locked</h1>
          <p>Hi {{name}},</p>
          <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
          <p>For security reasons, please wait {{lockoutDuration}} before trying again, or reset your password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>If you didn't attempt to log in, please contact our support team.</p>
          <p>Best regards,<br>The {{appName}} Team</p>
        </div>
      `,
      text: 'Your account has been locked. Reset your password at: {{resetUrl}}'
    });

    logger.info('Email templates loaded successfully');
  }

  /**
   * Replace template variables with actual data
   */
  private replaceTemplateVariables(template: string, data: Record<string, any>): string {
    return template.replace(/{{(\w+)}}/g, (match, key) => {
      return data[key] || match;
    });
  }

  /**
   * Get email template
   */
  private getTemplate(templateName: string): EmailTemplate {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new ApiError(
        `Email template '${templateName}' not found`,
        StatusCodes.NOT_FOUND
      );
    }
    return template;
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      let { subject, html, text } = options;

      // Use template if specified
      if (options.template && options.templateData) {
        const template = this.getTemplate(options.template);
        subject = this.replaceTemplateVariables(template.subject, options.templateData);
        html = this.replaceTemplateVariables(template.html, options.templateData);
        text = template.text ? this.replaceTemplateVariables(template.text, options.templateData) : undefined;
      }

      const mailOptions: SendMailOptions = {
        from: this.config.from,
        to: options.to,
        subject: subject || options.subject,
        html: html || options.html,
        text: text || options.text,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully:', {
        to: options.to,
        subject: subject || options.subject,
        messageId: result.messageId,
      });
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new ApiError(
        'Failed to send email',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, userData: { name: string; verificationUrl: string }): Promise<void> {
    await this.sendEmail({
      to,
      template: 'welcome',
      subject: '', // Will be overridden by template
      templateData: {
        name: userData.name,
        verificationUrl: userData.verificationUrl,
        appName: process.env.APP_NAME || 'Our App',
      },
    });
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(to: string, userData: { name: string; verificationUrl: string }): Promise<void> {
    await this.sendEmail({
      to,
      template: 'email-verification',
      subject: '', // Will be overridden by template
      templateData: {
        name: userData.name,
        verificationUrl: userData.verificationUrl,
        expirationTime: process.env.EMAIL_VERIFICATION_EXPIRY || '24 hours',
        appName: process.env.APP_NAME || 'Our App',
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, userData: { name: string; resetUrl: string }): Promise<void> {
    await this.sendEmail({
      to,
      template: 'password-reset',
      subject: '', // Will be overridden by template
      templateData: {
        name: userData.name,
        resetUrl: userData.resetUrl,
        expirationTime: process.env.PASSWORD_RESET_EXPIRY || '1 hour',
        appName: process.env.APP_NAME || 'Our App',
      },
    });
  }

  /**
   * Send password changed notification
   */
  async sendPasswordChangedNotification(to: string, userData: { name: string }): Promise<void> {
    await this.sendEmail({
      to,
      template: 'password-changed',
      subject: '', // Will be overridden by template
      templateData: {
        name: userData.name,
        date: new Date().toLocaleDateString(),
        appName: process.env.APP_NAME || 'Our App',
      },
    });
  }

  /**
   * Send account locked notification
   */
  async sendAccountLockedNotification(to: string, userData: { name: string; resetUrl: string }): Promise<void> {
    await this.sendEmail({
      to,
      template: 'account-locked',
      subject: '', // Will be overridden by template
      templateData: {
        name: userData.name,
        resetUrl: userData.resetUrl,
        lockoutDuration: process.env.ACCOUNT_LOCKOUT_DURATION || '30 minutes',
        appName: process.env.APP_NAME || 'Our App',
      },
    });
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Add custom email template
   */
  addTemplate(name: string, template: EmailTemplate): void {
    this.templates.set(name, template);
    logger.info(`Email template '${name}' added successfully`);
  }

  /**
   * Get available templates
   */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }
}

// Create singleton instance
export const emailService = new EmailService();
export default emailService;