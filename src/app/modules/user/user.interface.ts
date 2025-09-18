import { Document, Model } from 'mongoose';
import { IUser, IUserMethods } from '@/types';

// User document interface (extends Mongoose Document)
export interface IUserDocument extends IUser, IUserMethods, Document {
  _id: string;
}

// User model interface (static methods)
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>;
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
  findActiveUsers(): Promise<IUserDocument[]>;
  findByRole(role: string): Promise<IUserDocument[]>;
}

// User creation interface
export interface ICreateUser {
  name: string;
  email: string;
  password?: string;
  role?: 'user' | 'admin';
  profileImage?: string;
  isEmailVerified?: boolean;
  authProvider?: string;
  authProviderId?: string;
}

// User update interface
export interface IUpdateUser {
  name?: string;
  email?: string;
  profileImage?: string;
  role?: 'user' | 'admin';
  isEmailVerified?: boolean;
  authProvider?: string;
  authProviderId?: string;
}

// User query interface
export interface IUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'user' | 'admin';
  isEmailVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// User response interface (without sensitive data)
export interface IUserResponse {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  profileImage?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User profile update interface
export interface IUpdateProfile {
  name?: string;
  profileImage?: string;
}

// Change password interface
export interface IChangePassword {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// User statistics interface
export interface IUserStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number; // Users created in last 30 days
}

// User filter interface
export interface IUserFilter {
  name?: RegExp;
  email?: RegExp;
  role?: string;
  isEmailVerified?: boolean;
  startDate?: Date;
  endDate?: Date;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

// User aggregation pipeline interface
export interface IUserAggregation {
  match?: any;
  sort?: any;
  skip?: number;
  limit?: number;
  project?: any;
}

// All interfaces are exported as named exports above
// No default export needed for interfaces