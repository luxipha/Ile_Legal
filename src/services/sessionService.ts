import { supabase } from '../lib/supabase';
import { ActivityService } from './activityService';

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: string;
  ip_address?: string;
  location?: string;
  user_agent?: string;
  created_at: string;
  last_active: string;
  is_current: boolean;
}

export interface SessionDeviceInfo {
  browser: string;
  os: string;
  deviceType: string;
  location?: string;
}

export class SessionService {
  /**
   * Get current session info from browser/environment
   */
  static getCurrentSessionInfo(): SessionDeviceInfo {
    const userAgent = navigator.userAgent;
    
    // Simple browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Simple OS detection
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    // Device type detection
    let deviceType = 'Desktop';
    if (userAgent.includes('Mobile')) deviceType = 'Mobile';
    else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) deviceType = 'Tablet';

    return {
      browser,
      os,
      deviceType,
      location: 'Nigeria' // This would typically come from IP geolocation
    };
  }

  /**
   * Create a new session record (called on login)
   */
  static async createSession(): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const sessionInfo = this.getCurrentSessionInfo();
      const sessionId = crypto.randomUUID();

      // Note: This is a simplified implementation
      // In a real app, you'd want proper session management with refresh tokens
      const sessionData = {
        id: sessionId,
        user_id: user.data.user.id,
        session_token: user.data.user.access_token || sessionId,
        device_info: `${sessionInfo.os} • ${sessionInfo.browser}`,
        ip_address: 'Unknown', // Would be set server-side
        location: sessionInfo.location,
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        is_current: true
      };

      // Store in localStorage for demo purposes
      // In production, this would be handled server-side
      const existingSessions = JSON.parse(localStorage.getItem('user_sessions') || '[]');
      
      // Mark all other sessions as not current
      const updatedSessions = existingSessions.map((session: UserSession) => ({
        ...session,
        is_current: false
      }));
      
      updatedSessions.push(sessionData);
      localStorage.setItem('user_sessions', JSON.stringify(updatedSessions));

      // Log the login activity
      await ActivityService.logActivity({
        action_type: 'login',
        action_description: `Logged in from ${sessionInfo.os} ${sessionInfo.browser}`,
        metadata: {
          device_info: sessionData.device_info,
          location: sessionInfo.location,
          session_id: sessionId
        }
      });

    } catch (error) {
      console.error('Error creating session:', error);
    }
  }

  /**
   * Get all active sessions for current user
   */
  static async getActiveSessions(): Promise<UserSession[]> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return [];

      // Get sessions from localStorage (demo implementation)
      const sessions = JSON.parse(localStorage.getItem('user_sessions') || '[]');
      
      // Filter sessions for current user and sort by last active
      return sessions
        .filter((session: UserSession) => session.user_id === user.data.user!.id)
        .sort((a: UserSession, b: UserSession) => 
          new Date(b.last_active).getTime() - new Date(a.last_active).getTime()
        );

    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  /**
   * Update session last active time
   */
  static async updateSessionActivity(): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const sessions = JSON.parse(localStorage.getItem('user_sessions') || '[]');
      const updatedSessions = sessions.map((session: UserSession) => {
        if (session.user_id === user.data.user!.id && session.is_current) {
          return {
            ...session,
            last_active: new Date().toISOString()
          };
        }
        return session;
      });

      localStorage.setItem('user_sessions', JSON.stringify(updatedSessions));

    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  /**
   * Terminate a specific session
   */
  static async terminateSession(sessionId: string): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const sessions = JSON.parse(localStorage.getItem('user_sessions') || '[]');
      const sessionToTerminate = sessions.find((s: UserSession) => s.id === sessionId);
      
      if (!sessionToTerminate) {
        throw new Error('Session not found');
      }

      // Remove the session
      const updatedSessions = sessions.filter((session: UserSession) => session.id !== sessionId);
      localStorage.setItem('user_sessions', JSON.stringify(updatedSessions));

      // If terminating current session, log out
      if (sessionToTerminate.is_current) {
        await supabase.auth.signOut();
      }

      // Log the termination activity
      await ActivityService.logActivity({
        action_type: 'security',
        action_description: `Terminated session: ${sessionToTerminate.device_info}`,
        metadata: {
          terminated_session_id: sessionId,
          device_info: sessionToTerminate.device_info,
          location: sessionToTerminate.location
        }
      });

    } catch (error) {
      console.error('Error terminating session:', error);
      throw error;
    }
  }

  /**
   * Terminate all other sessions (keep current)
   */
  static async terminateAllOtherSessions(): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const sessions = JSON.parse(localStorage.getItem('user_sessions') || '[]');
      const currentSession = sessions.find((s: UserSession) => 
        s.user_id === user.data.user!.id && s.is_current
      );

      if (!currentSession) return;

      // Keep only the current session
      const updatedSessions = sessions.filter((session: UserSession) => 
        session.user_id !== user.data.user!.id || session.is_current
      );
      
      localStorage.setItem('user_sessions', JSON.stringify(updatedSessions));

      // Log the activity
      await ActivityService.logActivity({
        action_type: 'security',
        action_description: 'Terminated all other sessions',
        metadata: {
          sessions_terminated: sessions.length - updatedSessions.length
        }
      });

    } catch (error) {
      console.error('Error terminating all sessions:', error);
      throw error;
    }
  }

  /**
   * Get relative time string for session
   */
  static getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'Active now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  /**
   * Initialize session tracking (call on app startup)
   */
  static async initializeSessionTracking(): Promise<void> {
    try {
      // Create current session if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.createSession();
        
        // Set up periodic session activity updates
        setInterval(() => {
          this.updateSessionActivity();
        }, 5 * 60 * 1000); // Update every 5 minutes
      }
    } catch (error) {
      console.error('Error initializing session tracking:', error);
    }
  }
}