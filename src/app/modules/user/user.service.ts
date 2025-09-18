import { FilterQuery, UpdateQuery } from 'mongoose';
import { User } from './user.model';
import {
  IUserDocument,
  ICreateUser,
  IUpdateUser,
  IUserQuery,
  IUserResponse,
  IUpdateProfile,
  IChangePassword,
  IUserStats,
  IUserFilter,
} from './user.interface';
import { PasswordUtils } from '@/utils';
import { 
  BadRequestError, 
  NotFoundError, 
  ConflictError,
  UnauthorizedError 
} from '@/shared/errors';
import { StatusCodes } from 'http-status-codes';
import { 
  MESSAGES, 
  PAGINATION_DEFAULTS,
  USER_ROLES 
} from '@/shared/constants';
import { PaginatedResponse } from '@/types';

export class UserService {
  /**
   * Create a new user
   */
  static async createUser(userData: ICreateUser): Promise<IUserDocument> {
    // Check if email is already taken
    const existingUser = await User.isEmailTaken(userData.email);
    if (existingUser) {
      throw new ConflictError(MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    return user;
  }

  /**
   * Get all users with pagination and filtering
   */
  static async getUsers(options: IUserQuery): Promise<PaginatedResponse<IUserResponse[]>> {
    const {
      page = PAGINATION_DEFAULTS.DEFAULT_PAGE,
      limit = PAGINATION_DEFAULTS.DEFAULT_LIMIT,
      search,
      role,
      isEmailVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build filter query
    const filter: FilterQuery<IUserDocument> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (typeof isEmailVerified === 'boolean') {
      filter.isEmailVerified = isEmailVerified;
    }

    // Build sort query
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute queries
    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Transform users to IUserResponse format
    const transformedUsers: IUserResponse[] = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalUsers / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: transformedUsers,
      statusCode: 200,
      meta: {
        page,
        limit,
        total: totalUsers,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<IUserDocument | null> {
    return await User.findByEmail(email);
  }

  /**
   * Update user by ID
   */
  static async updateUser(
    userId: string,
    updateData: IUpdateUser
  ): Promise<IUserDocument> {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    // Check if email is being updated and if it's already taken
    if (updateData.email && updateData.email !== user.email) {
      const emailTaken = await User.isEmailTaken(updateData.email, userId);
      if (emailTaken) {
        throw new ConflictError(MESSAGES.EMAIL_ALREADY_EXISTS);
      }
    }

    // Update user
    Object.assign(user, updateData);
    await user.save();

    return user;
  }

  /**
   * Update user profile (limited fields)
   */
  static async updateProfile(
    userId: string,
    profileData: IUpdateProfile
  ): Promise<IUserDocument> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    // Update only allowed profile fields
    if (profileData.name) user.name = profileData.name;
    if (profileData.profileImage !== undefined) user.profileImage = profileData.profileImage;

    await user.save();
    return user;
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    passwordData: IChangePassword
  ): Promise<void> {
    // Get user with password
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError(MESSAGES.INVALID_CURRENT_PASSWORD);
    }

    // Update password
    user.password = passwordData.newPassword;
    await user.save();
  }

  /**
   * Delete user by ID
   */
  static async deleteUser(userId: string): Promise<void> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    await User.findByIdAndDelete(userId);
  }

  /**
   * Bulk delete users
   */
  static async bulkDeleteUsers(userIds: string[]): Promise<{ deletedCount: number }> {
    const result = await User.deleteMany({ _id: { $in: userIds } });
    return { deletedCount: result.deletedCount || 0 };
  }

  /**
   * Check if email is available
   */
  static async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    const emailTaken = await User.isEmailTaken(email);
    return { available: !emailTaken };
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(filter?: IUserFilter): Promise<IUserStats> {
    const matchStage: any = {};

    if (filter?.startDate || filter?.endDate) {
      matchStage.createdAt = {};
      if (filter.startDate) matchStage.createdAt.$gte = filter.startDate;
      if (filter.endDate) matchStage.createdAt.$lte = filter.endDate;
    }

    const [stats] = await User.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          verifiedUsers: {
            $sum: { $cond: [{ $eq: ['$isEmailVerified', true] }, 1, 0] },
          },
          unverifiedUsers: {
            $sum: { $cond: [{ $eq: ['$isEmailVerified', false] }, 1, 0] },
          },
          adminUsers: {
            $sum: { $cond: [{ $eq: ['$role', USER_ROLES.ADMIN] }, 1, 0] },
          },
          regularUsers: {
            $sum: { $cond: [{ $eq: ['$role', USER_ROLES.USER] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalUsers: 1,
          verifiedUsers: 1,
          unverifiedUsers: 1,
          adminUsers: 1,
          regularUsers: 1,
          verificationRate: {
            $cond: [
              { $eq: ['$totalUsers', 0] },
              0,
              { $multiply: [{ $divide: ['$verifiedUsers', '$totalUsers'] }, 100] },
            ],
          },
        },
      },
    ]);

    return stats || {
      totalUsers: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0,
      adminUsers: 0,
      regularUsers: 0,
      verificationRate: 0,
    };
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(role: string): Promise<IUserDocument[]> {
    return await User.findByRole(role);
  }

  /**
   * Get active users (verified email)
   */
  static async getActiveUsers(): Promise<IUserDocument[]> {
    return await User.findActiveUsers();
  }

  /**
   * Update user's refresh token
   */
  static async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshToken });
  }

  /**
   * Find user by refresh token
   */
  static async findUserByRefreshToken(refreshToken: string): Promise<IUserDocument | null> {
    return await User.findOne({ refreshToken }).select('+refreshToken');
  }

  /**
   * Update user's email verification status
   */
  static async verifyEmail(userId: string): Promise<IUserDocument> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * Set password reset token
   */
  static async setPasswordResetToken(email: string): Promise<{ user: IUserDocument; resetToken: string }> {
    const user = await User.findByEmail(email);
    
    if (!user) {
      throw new NotFoundError(MESSAGES.USER_NOT_FOUND);
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    return { user, resetToken };
  }

  /**
   * Reset password using token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    // Hash the token to compare with stored hash
    const hashedToken = PasswordUtils.hashPasswordResetToken(token);

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new BadRequestError(MESSAGES.INVALID_OR_EXPIRED_TOKEN);
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();
  }
}

export default UserService;