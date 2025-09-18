import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserDocument, IUserModel } from './user.interface';
import { PasswordUtils, JWTUtils } from '@/utils';
import { USER_ROLES } from '@/shared/constants';
import config from '@/config';

// User schema definition
const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Don't include password in queries by default
    },
    profileImage: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.USER,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false, // Don't include refresh token in queries by default
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    authProvider: {
      type: String,
      default: null,
    },
    authProviderId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        if ('password' in ret) delete (ret as any).password;
        if ('refreshToken' in ret) delete (ret as any).refreshToken;
        if ('passwordResetToken' in ret) delete (ret as any).passwordResetToken;
        if ('passwordResetExpires' in ret) delete (ret as any).passwordResetExpires;
        if ('__v' in ret) delete (ret as any).__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        if ('password' in ret) delete (ret as any).password;
        if ('refreshToken' in ret) delete (ret as any).refreshToken;
        if ('passwordResetToken' in ret) delete (ret as any).passwordResetToken;
        if ('passwordResetExpires' in ret) delete (ret as any).passwordResetExpires;
        if ('__v' in ret) delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isEmailVerified: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    this.password = await PasswordUtils.hashPassword(this.password);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await PasswordUtils.comparePassword(candidatePassword, this.password);
};

// Instance method to generate access token
userSchema.methods.generateAccessToken = function (): string {
  return JWTUtils.generateAccessToken({
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
  });
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function (): string {
  return JWTUtils.generateRefreshToken({
    userId: this._id.toString(),
    email: this.email,
    role: this.role,
  });
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = PasswordUtils.generatePasswordResetToken();
  
  // Hash the token and set it to passwordResetToken field
  this.passwordResetToken = PasswordUtils.hashPasswordResetToken(resetToken);
  
  // Set token expiry time (1 hour from now)
  this.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  
  // Return the unhashed token (to be sent via email)
  return resetToken;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

// Static method to check if email is taken
userSchema.statics.isEmailTaken = async function (
  email: string,
  excludeUserId?: string
): Promise<boolean> {
  const query: any = { email: email.toLowerCase() };
  
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }
  
  const user = await this.findOne(query);
  return !!user;
};

// Static method to find active users
userSchema.statics.findActiveUsers = function () {
  return this.find({ isEmailVerified: true });
};

// Static method to find users by role
userSchema.statics.findByRole = function (role: string) {
  return this.find({ role });
};

// Create and export the User model
export const User = model<IUserDocument, IUserModel>('User', userSchema);

export default User;