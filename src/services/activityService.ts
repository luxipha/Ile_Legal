import { supabase } from '../lib/supabase';

export interface AdminActivity {
  id: string;
  admin_id: string;
  action_type: string;
  action_description: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivityStats {
  total_actions: number;
  actions_today: number;
  actions_this_week: number;
  most_common_action: string;
}

export class ActivityService {
  /**
   * Log an admin activity
   */
  static async logActivity(data: {
    action_type: string;
    action_description: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_activity_log')
        .insert({
          admin_id: (await supabase.auth.getUser()).data.user?.id,
          action_type: data.action_type,
          action_description: data.action_description,
          metadata: data.metadata || {},
          // Note: IP and user agent would typically be added server-side
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw - activity logging should not break main functionality
    }
  }

  /**
   * Get recent activities for current admin
   */
  static async getRecentActivities(limit = 10): Promise<AdminActivity[]> {
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  /**
   * Get activities for a specific admin (admin-only)
   */
  static async getActivitiesForAdmin(adminId: string, limit = 50): Promise<AdminActivity[]> {
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admin activities:', error);
      return [];
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(): Promise<ActivityStats | null> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return null;

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get total count
      const { count: totalCount } = await supabase
        .from('admin_activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', userId);

      // Get today's count
      const { count: todayCount } = await supabase
        .from('admin_activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', userId)
        .gte('created_at', todayStart.toISOString());

      // Get this week's count
      const { count: weekCount } = await supabase
        .from('admin_activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', userId)
        .gte('created_at', weekStart.toISOString());

      // Get most common action type
      const { data: actionTypes } = await supabase
        .from('admin_activity_log')
        .select('action_type')
        .eq('admin_id', userId);

      let mostCommonAction = 'N/A';
      if (actionTypes && actionTypes.length > 0) {
        const actionCounts = actionTypes.reduce((acc, item) => {
          acc[item.action_type] = (acc[item.action_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        mostCommonAction = Object.entries(actionCounts)
          .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';
      }

      return {
        total_actions: totalCount || 0,
        actions_today: todayCount || 0,
        actions_this_week: weekCount || 0,
        most_common_action: mostCommonAction
      };

    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return null;
    }
  }

  /**
   * Get activity color based on action type
   */
  static getActivityColor(actionType: string): string {
    const colorMap: Record<string, string> = {
      login: 'bg-green-500',
      logout: 'bg-gray-500',
      profile_update: 'bg-blue-500',
      security: 'bg-red-500',
      role_management: 'bg-purple-500',
      user_management: 'bg-yellow-500',
      system: 'bg-indigo-500',
      dispute: 'bg-orange-500'
    };

    return colorMap[actionType] || 'bg-gray-500';
  }

  /**
   * Format activity description for display
   */
  static formatActivityDescription(activity: AdminActivity): string {
    return activity.action_description;
  }

  /**
   * Get relative time string
   */
  static getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }
}