import { supabase } from '../lib/supabase';

export interface LoyaltyStats {
  total_bricks: number;
  streak_days: number;
  last_login_date: string | null;
  loyalty_level: string;
}

export interface BricksTransaction {
  id: string;
  user_id: string;
  bricks_amount: number;
  transaction_type: 'earned' | 'spent' | 'bonus';
  reason: string;
  metadata: any;
  created_at: string;
}

/**
 * Loyalty Service for Bricks points system
 * Handles points tracking for both buyers and sellers
 */
export class LoyaltyService {
  
  /**
   * Get user's loyalty stats (Bricks, streak, level)
   */
  async getUserLoyaltyStats(userId: string): Promise<LoyaltyStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_loyalty_stats', { p_user_id: userId });

      if (error) {
        console.error('Error fetching loyalty stats:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error getting user loyalty stats:', error);
      return null;
    }
  }

  /**
   * Award Bricks to user
   */
  async awardBricks(
    userId: string,
    bricksAmount: number,
    reason: string,
    transactionType: 'earned' | 'spent' | 'bonus' = 'earned',
    metadata: any = {}
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('award_bricks', {
          p_user_id: userId,
          p_bricks_amount: bricksAmount,
          p_reason: reason,
          p_transaction_type: transactionType,
          p_metadata: metadata
        });

      if (error) {
        console.error('Error awarding bricks:', error);
        return null;
      }

      console.log(`Awarded ${bricksAmount} Bricks to user ${userId} for ${reason}`);
      
      // Check and award loyalty badges after awarding bricks
      await this.checkAndAwardLoyaltyBadges(userId);
      
      return data;
    } catch (error) {
      console.error('Error awarding bricks:', error);
      return null;
    }
  }

  /**
   * Update login streak and award streak points
   */
  async updateLoginStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('update_login_streak', { p_user_id: userId });

      if (error) {
        console.error('Error updating login streak:', error);
        return 0;
      }

      const streakDays = data || 0;
      
      // Award daily login points
      if (streakDays > 0) {
        await this.awardBricks(userId, 5, 'daily login', 'earned', { streak_days: streakDays });
        
        // Bonus for streak milestones
        if (streakDays === 7) {
          await this.awardBricks(userId, 25, '7-day streak bonus', 'bonus', { milestone: '7_day_streak' });
        } else if (streakDays === 30) {
          await this.awardBricks(userId, 100, '30-day streak bonus', 'bonus', { milestone: '30_day_streak' });
        }
      }

      // Check and award loyalty badges after streak update
      await this.checkAndAwardLoyaltyBadges(userId);
      
      return streakDays;
    } catch (error) {
      console.error('Error updating login streak:', error);
      return 0;
    }
  }

  /**
   * Award points for platform activities
   */
  async awardActivityBricks(userId: string, activityType: string, metadata: any = {}): Promise<void> {
    const activityPoints: { [key: string]: { points: number; reason: string } } = {
      'gig_completed': { points: 50, reason: 'completing gig' },
      'gig_created': { points: 10, reason: 'creating gig listing' },
      'review_given': { points: 5, reason: 'leaving review' },
      'profile_completed': { points: 25, reason: 'completing profile' },
      'document_uploaded': { points: 5, reason: 'uploading document' },
      'payment_received': { points: 10, reason: 'receiving payment' },
      'dispute_resolved': { points: 30, reason: 'resolving dispute' }
    };

    const activity = activityPoints[activityType];
    if (activity) {
      await this.awardBricks(userId, activity.points, activity.reason, 'earned', {
        activity_type: activityType,
        ...metadata
      });
    }
  }

  /**
   * Get user's Bricks transaction history
   */
  async getBricksTransactions(userId: string, limit: number = 50): Promise<BricksTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('bricks_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching bricks transactions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting bricks transactions:', error);
      return [];
    }
  }

  /**
   * Check and award loyalty badges based on user's stats
   */
  private async checkAndAwardLoyaltyBadges(userId: string): Promise<void> {
    try {
      const stats = await this.getUserLoyaltyStats(userId);
      if (!stats) return;

      // Import ReputationService to use badge awarding functionality
      const { reputationService } = await import('./reputationService');

      // Active User Badge - 7+ logins
      if (stats.streak_days >= 7) {
        const { data: hasActiveBadge } = await supabase
          .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'loyalty_active' });

        if (!hasActiveBadge) {
          await reputationService.awardBadge(userId, 'loyalty_active', undefined, {
            streak_days: stats.streak_days
          });
        }
      }

      // Bricks Collector Badge - 100+ Bricks
      if (stats.total_bricks >= 100) {
        const { data: hasMilestoneBadge } = await supabase
          .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'loyalty_milestone' });

        if (!hasMilestoneBadge) {
          await reputationService.awardBadge(userId, 'loyalty_milestone', undefined, {
            total_bricks: stats.total_bricks
          });
        }
      }

      // Streak Master Badge - 7+ consecutive days
      if (stats.streak_days >= 7) {
        const { data: hasStreakBadge } = await supabase
          .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'loyalty_streak' });

        if (!hasStreakBadge) {
          await reputationService.awardBadge(userId, 'loyalty_streak', undefined, {
            streak_days: stats.streak_days
          });
        }
      }

      // Platform Enthusiast Badge - High engagement (based on transaction count)
      const transactions = await this.getBricksTransactions(userId, 100);
      const earnedTransactions = transactions.filter(t => t.transaction_type === 'earned');
      
      if (earnedTransactions.length >= 20) {
        const { data: hasEngagementBadge } = await supabase
          .rpc('user_has_badge', { p_user_id: userId, p_badge_id: 'loyalty_engagement' });

        if (!hasEngagementBadge) {
          await reputationService.awardBadge(userId, 'loyalty_engagement', undefined, {
            activities_count: earnedTransactions.length
          });
        }
      }

    } catch (error) {
      console.error('Error checking and awarding loyalty badges:', error);
    }
  }

  /**
   * Get loyalty level description based on Bricks count
   */
  getLoyaltyLevelInfo(totalBricks: number): { level: string; color: string; description: string } {
    if (totalBricks >= 500) {
      return { level: 'Gold', color: '#FFD700', description: 'Premium loyalty member' };
    } else if (totalBricks >= 200) {
      return { level: 'Silver', color: '#C0C0C0', description: 'Valued loyalty member' };
    } else if (totalBricks >= 50) {
      return { level: 'Bronze', color: '#CD7F32', description: 'Active loyalty member' };
    } else {
      return { level: 'Starter', color: '#6B7280', description: 'New loyalty member' };
    }
  }

  /**
   * Initialize loyalty system for new user
   */
  async initializeUserLoyalty(userId: string): Promise<void> {
    try {
      // Award welcome bonus
      await this.awardBricks(userId, 20, 'welcome bonus', 'bonus', { welcome: true });
      console.log(`Initialized loyalty system for user ${userId}`);
    } catch (error) {
      console.error('Error initializing user loyalty:', error);
    }
  }
}

// Export singleton instance
export const loyaltyService = new LoyaltyService();