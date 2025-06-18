// Admin API Service - Clean interface for admin user management

import { api } from './api';
import {
  UserProfile,
  UserWithAuth,
  UserDocument,
  UserNotification,
  UserListResponse,
  UserStats,
  VerifyUserRequest,
  RejectUserRequest,
  RequestInfoRequest,
  UpdateDocumentStatusRequest,
  GetUsersParams,
  ApiResponse,
  AdminDashboardStats
} from '../types/admin';

/**
 * Admin API Service Class
 * Provides a clean interface for all admin-related operations
 */
export class AdminApiService {
  
  /**
   * User Management Methods
   */
  
  /**
   * Get all users with optional filtering and pagination
   * @param params - Filter and pagination parameters
   * @returns Promise<ApiResponse<UserListResponse>>
   */
  static async getUsers(params: GetUsersParams = {}): Promise<ApiResponse<UserListResponse>> {
    try {
      const { status, page = 1, limit = 20 } = params;
      const result = await api.admin.users.getAllUsers(status, page, limit);
      
      return {
        data: result,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to fetch users',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Get specific user details with documents
   * @param userId - User ID
   * @returns Promise<ApiResponse<UserProfile>>
   */
  static async getUserById(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const user = await api.admin.users.getUserById(userId);
      
      return {
        data: user,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to fetch user details',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Verify a user
   * @param request - Verification request data
   * @returns Promise<ApiResponse<UserProfile>>
   */
  static async verifyUser(request: VerifyUserRequest): Promise<ApiResponse<UserProfile>> {
    try {
      const { userId, adminId, notes } = request;
      const user = await api.admin.users.verifyUser(userId, adminId, notes);
      
      return {
        data: user,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to verify user',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Reject a user with reason
   * @param request - Rejection request data
   * @returns Promise<ApiResponse<UserProfile>>
   */
  static async rejectUser(request: RejectUserRequest): Promise<ApiResponse<UserProfile>> {
    try {
      const { userId, adminId, reason, notes } = request;
      const user = await api.admin.users.rejectUser(userId, adminId, reason, notes);
      
      return {
        data: user,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to reject user',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Request additional information from user
   * @param request - Info request data
   * @returns Promise<ApiResponse<UserNotification>>
   */
  static async requestInfo(request: RequestInfoRequest): Promise<ApiResponse<UserNotification>> {
    try {
      const { userId, adminId, requestedInfo, message } = request;
      const notification = await api.admin.users.requestInfo(userId, adminId, requestedInfo, message);
      
      return {
        data: notification,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to request user information',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Get user's verification documents
   * @param userId - User ID
   * @returns Promise<ApiResponse<UserDocument[]>>
   */
  static async getUserDocuments(userId: string): Promise<ApiResponse<UserDocument[]>> {
    try {
      const documents = await api.admin.users.getUserDocuments(userId);
      
      return {
        data: documents,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to fetch user documents',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Update document verification status
   * @param request - Document status update request
   * @returns Promise<ApiResponse<UserDocument>>
   */
  static async updateDocumentStatus(request: UpdateDocumentStatusRequest): Promise<ApiResponse<UserDocument>> {
    try {
      const { userId, documentId, status, adminId, notes } = request;
      const document = await api.admin.users.updateDocumentStatus(userId, documentId, status, adminId, notes);
      
      return {
        data: document,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to update document status',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Get user statistics for admin dashboard
   * @returns Promise<ApiResponse<UserStats>>
   */
  static async getUserStats(): Promise<ApiResponse<UserStats>> {
    try {
      const stats = await api.admin.users.getUserStats();
      
      return {
        data: stats,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to fetch user statistics',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Utility Methods
   */

  /**
   * Get pending verification requests
   * @param limit - Number of requests to fetch
   * @returns Promise<ApiResponse<UserWithAuth[]>>
   */
  static async getPendingVerifications(limit: number = 10): Promise<ApiResponse<UserWithAuth[]>> {
    try {
      const result = await api.admin.users.getAllUsers('pending', 1, limit);
      
      return {
        data: result.users,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to fetch pending verifications',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Search users by email or name
   * @param query - Search query
   * @param limit - Number of results to return
   * @returns Promise<ApiResponse<UserWithAuth[]>>
   */
  static async searchUsers(query: string, limit: number = 20): Promise<ApiResponse<UserWithAuth[]>> {
    try {
      // This would need to be implemented in the backend with proper search functionality
      // For now, we'll fetch all users and filter client-side (not recommended for production)
      const result = await api.admin.users.getAllUsers(undefined, 1, limit);
      
      const filteredUsers = result.users.filter((user: any) => 
        user.auth?.email?.toLowerCase().includes(query.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(query.toLowerCase()))
      );
      
      return {
        data: filteredUsers,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to search users',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Bulk operations
   */

  /**
   * Bulk verify multiple users
   * @param userIds - Array of user IDs
   * @param adminId - Admin performing the action
   * @param notes - Optional notes
   * @returns Promise<ApiResponse<{ success: string[], failed: string[] }>>
   */
  static async bulkVerifyUsers(
    userIds: string[], 
    adminId: string, 
    notes?: string
  ): Promise<ApiResponse<{ success: string[], failed: string[] }>> {
    const results = {
      success: [] as string[],
      failed: [] as string[]
    };

    for (const userId of userIds) {
      try {
        await api.admin.users.verifyUser(userId, adminId, notes);
        results.success.push(userId);
      } catch (error) {
        results.failed.push(userId);
      }
    }

    return {
      data: results,
      success: true
    };
  }

  /**
   * Export user data (for admin reports)
   * @param filters - Optional filters
   * @returns Promise<ApiResponse<UserWithAuth[]>>
   */
  static async exportUsers(filters: GetUsersParams = {}): Promise<ApiResponse<UserWithAuth[]>> {
    try {
      // Fetch all users matching the filters (remove pagination for export)
      const result = await api.admin.users.getAllUsers(filters.status, 1, 10000);
      
      return {
        data: result.users,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to export user data',
          details: error
        },
        success: false
      };
    }
  }

  /**
   * Get admin dashboard statistics
   * @returns Promise<ApiResponse<AdminDashboardStats>>
   */
  static async getDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
    try {
      // This would typically make multiple API calls to get comprehensive stats
      const userStats = await api.admin.users.getUserStats();
      
      // Mock data for other stats - these would come from other API endpoints
      const dashboardStats: AdminDashboardStats = {
        users: userStats,
        gigs: {
          total: 0,
          active: 0,
          pending: 0,
          completed: 0,
          flagged: 0
        },
        disputes: {
          total: 0,
          pending: 0,
          inReview: 0,
          resolved: 0
        },
        revenue: {
          total: 0,
          thisMonth: 0,
          lastMonth: 0,
          growth: 0
        }
      };
      
      return {
        data: dashboardStats,
        success: true
      };
    } catch (error: any) {
      return {
        error: {
          message: error.message || 'Failed to fetch dashboard statistics',
          details: error
        },
        success: false
      };
    }
  }
}

// Export default instance for convenience
export default AdminApiService;