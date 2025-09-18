import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { UserService } from './user.service';
import { ResponseUtils } from '@/utils';
import { MESSAGES } from '@/shared/constants';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AuthenticatedRequest } from '@/types';

export class UserController {
  /**
   * Create a new user
   * POST /api/users
   */
  static createUser = asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;
    
    const user = await UserService.createUser(userData);
    
    ResponseUtils.created(res, {
      message: MESSAGES.USER_CREATED_SUCCESSFULLY,
      data: user,
    });
  });

  /**
   * Get all users with pagination and filtering
   * GET /api/users
   */
  static getUsers = asyncHandler(async (req: Request, res: Response) => {
    const queryOptions = req.query;
    
    const result = await UserService.getUsers(queryOptions);
    
    ResponseUtils.success(res, {
      message: MESSAGES.USERS_RETRIEVED_SUCCESSFULLY,
      data: result.data,
    });
  });

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  static getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      return ResponseUtils.badRequest(res, 'User ID is required');
    }
    
    const user = await UserService.getUserById(id);
    
    return ResponseUtils.success(res, {
      message: MESSAGES.USER_RETRIEVED_SUCCESSFULLY,
      data: user,
    });
  });

  /**
   * Get current user profile
   * GET /api/users/profile
   */
  static getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    
    const user = await UserService.getUserById(userId);
    
    ResponseUtils.success(res, {
      message: MESSAGES.USER_RETRIEVED_SUCCESSFULLY,
      data: user,
    });
  });

  /**
   * Update user by ID (Admin only)
   * PUT /api/users/:id
   */
  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return ResponseUtils.badRequest(res, 'User ID is required');
    }
    
    const user = await UserService.updateUser(id, updateData);
    
    return ResponseUtils.success(res, {
      message: MESSAGES.USER_UPDATED_SUCCESSFULLY,
      data: user,
    });
  });

  /**
   * Update current user profile
   * PUT /api/users/profile
   */
  static updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const profileData = req.body;
    
    const user = await UserService.updateProfile(userId, profileData);
    
    ResponseUtils.success(res, {
      message: MESSAGES.PROFILE_UPDATED_SUCCESSFULLY,
      data: user,
    });
  });

  /**
   * Change current user password
   * PUT /api/users/change-password
   */
  static changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const passwordData = req.body;
    
    await UserService.changePassword(userId, passwordData);
    
    ResponseUtils.success(res, {
      message: MESSAGES.PASSWORD_CHANGED_SUCCESSFULLY,
    });
  });

  /**
   * Delete user by ID
   * DELETE /api/users/:id
   */
  static deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      return ResponseUtils.badRequest(res, 'User ID is required');
    }
    
    await UserService.deleteUser(id);
    
    return ResponseUtils.success(res, {
      message: MESSAGES.USER_DELETED_SUCCESSFULLY,
    });
  });

  /**
   * Delete current user account
   * DELETE /api/users/profile
   */
  static deleteCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    
    await UserService.deleteUser(userId);
    
    ResponseUtils.success(res, {
      message: MESSAGES.ACCOUNT_DELETED_SUCCESSFULLY,
    });
  });

  /**
   * Bulk delete users (Admin only)
   * DELETE /api/users/bulk
   */
  static bulkDeleteUsers = asyncHandler(async (req: Request, res: Response) => {
    const { userIds } = req.body;
    
    const result = await UserService.bulkDeleteUsers(userIds);
    
    ResponseUtils.success(res, {
      message: `${result.deletedCount} users deleted successfully`,
      data: result,
    });
  });

  /**
   * Check email availability
   * POST /api/users/check-email
   */
  static checkEmailAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    
    const result = await UserService.checkEmailAvailability(email);
    
    ResponseUtils.success(res, {
      message: result.available ? MESSAGES.EMAIL_AVAILABLE : MESSAGES.EMAIL_NOT_AVAILABLE,
      data: result,
    });
  });

  /**
   * Get user statistics (Admin only)
   * GET /api/users/statistics
   */
  static getUserStatistics = asyncHandler(async (req: Request, res: Response) => {
    const filter = req.query;
    
    const statistics = await UserService.getUserStatistics(filter);
    
    ResponseUtils.success(res, {
      message: MESSAGES.STATISTICS_RETRIEVED_SUCCESSFULLY,
      data: statistics,
    });
  });

  /**
   * Get users by role (Admin only)
   * GET /api/users/role/:role
   */
  static getUsersByRole = asyncHandler(async (req: Request, res: Response) => {
    const { role } = req.params;
    
    if (!role) {
      return ResponseUtils.badRequest(res, 'Role is required');
    }
    
    const users = await UserService.getUsersByRole(role);
    
    return ResponseUtils.success(res, {
      message: MESSAGES.USERS_RETRIEVED_SUCCESSFULLY,
      data: users,
    });
  });

  /**
   * Get active users (Admin only)
   * GET /api/users/active
   */
  static getActiveUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await UserService.getActiveUsers();
    
    ResponseUtils.success(res, {
      message: MESSAGES.ACTIVE_USERS_RETRIEVED_SUCCESSFULLY,
      data: users,
    });
  });

  /**
   * Verify user email (Admin only)
   * PUT /api/users/:id/verify-email
   */
  static verifyUserEmail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      return ResponseUtils.badRequest(res, 'User ID is required');
    }
    
    const user = await UserService.verifyEmail(id);
    
    return ResponseUtils.success(res, {
      message: MESSAGES.EMAIL_VERIFIED_SUCCESSFULLY,
      data: user,
    });
  });

  /**
   * Upload user avatar
   * POST /api/users/avatar
   */
  static uploadAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    const file = req.file;
    
    if (!file) {
      return ResponseUtils.badRequest(res, MESSAGES.FILE_REQUIRED);
    }

    // Here you would typically upload to Cloudinary
    // For now, we'll just update the profile with a placeholder URL
    const profileImageUrl = `https://example.com/avatars/${userId}`;
    
    const user = await UserService.updateProfile(userId, {
      profileImage: profileImageUrl,
    });
    
    return ResponseUtils.success(res, {
      message: MESSAGES.AVATAR_UPLOADED_SUCCESSFULLY,
      data: {
        profileImage: user.profileImage,
      },
    });
  });

  /**
   * Remove user avatar
   * DELETE /api/users/avatar
   */
  static removeAvatar = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!._id.toString();
    
    const user = await UserService.updateProfile(userId, {
      profileImage: undefined,
    });
    
    ResponseUtils.success(res, {
      message: MESSAGES.AVATAR_REMOVED_SUCCESSFULLY,
      data: user,
    });
  });
}

export default UserController;