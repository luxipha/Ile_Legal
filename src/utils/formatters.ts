/**
 * Standardized formatting utilities for consistent data display across the application
 */

// Date formatting utilities
export const formatDate = {
  /**
   * Format date in full format (e.g., "Dec 15, 2023")
   */
  full: (date: string | Date | null | undefined): string => {
    if (!date) return 'Date not available';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.log('Date formatting error:', error);
      return 'Date not available';
    }
  },
  
  /**
   * Format date in short format (e.g., "Dec 2023")
   */
  short: (date: string | Date | null | undefined): string => {
    if (!date) return 'Date not available';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      
      return dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      console.log('Date formatting error:', error);
      return 'Date not available';
    }
  },
  
  /**
   * Format date in relative format (e.g., "2 days ago")
   */
  relative: (date: string | Date | null | undefined): string => {
    if (!date) return 'Date not available';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - dateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return "1 day ago";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? "1 month ago" : `${months} months ago`;
      }
      const years = Math.floor(diffDays / 365);
      return years === 1 ? "1 year ago" : `${years} years ago`;
    } catch (error) {
      console.log('Date formatting error:', error);
      return 'Date not available';
    }
  },

  /**
   * Format time only (e.g., "2:30 PM")
   */
  time: (date: string | Date | null | undefined): string => {
    if (!date) return 'Time not available';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid time';
      
      return dateObj.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.log('Time formatting error:', error);
      return 'Time not available';
    }
  }
};

// Currency formatting utilities
export const formatCurrency = {
  /**
   * Format currency with Naira symbol and proper thousand separators
   */
  naira: (amount: number | string | null | undefined, fallback = 'Amount not specified'): string => {
    if (amount === null || amount === undefined) return fallback;
    
    const numAmount = typeof amount === 'string' ? 
      parseFloat(amount.replace(/[₦,]/g, '')) : amount;
    
    if (isNaN(numAmount)) return fallback;
    
    return `₦${numAmount.toLocaleString('en-NG')}`;
  },

  /**
   * Format currency without symbol (for calculations or comparisons)
   */
  number: (amount: number | string | null | undefined): number => {
    if (amount === null || amount === undefined) return 0;
    
    const numAmount = typeof amount === 'string' ? 
      parseFloat(amount.replace(/[₦,]/g, '')) : amount;
    
    return isNaN(numAmount) ? 0 : numAmount;
  }
};

// User name formatting utilities
export const formatUser = {
  /**
   * Get standardized display name for user
   */
  displayName: (user: any, fallback = 'User'): string => {
    if (user?.name?.trim()) return user.name.trim();
    if (user?.user_metadata?.full_name?.trim()) return user.user_metadata.full_name.trim();
    if (user?.user_metadata?.firstName || user?.user_metadata?.lastName) {
      const firstName = user.user_metadata.firstName?.trim() || '';
      const lastName = user.user_metadata.lastName?.trim() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;
    }
    if (user?.email) return user.email.split('@')[0];
    return fallback;
  },

  /**
   * Get user initials for avatar generation
   */
  initials: (user: any): string => {
    const name = formatUser.displayName(user, 'U');
    return name.split(' ')
      .map((n: string) => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Generate consistent avatar URL
   */
  avatar: (user: any, size = 128): string => {
    // Priority: stored avatar -> user metadata -> generated
    if (user?.user_metadata?.avatar_url && 
        !user.user_metadata.avatar_url.includes('ui-avatars.com')) {
      return user.user_metadata.avatar_url;
    }
    
    const initials = formatUser.initials(user);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=white&size=${size}`;
  }
};

// Status formatting utilities
export const formatStatus = {
  /**
   * Standardize status display with consistent colors
   */
  badge: (status: string): { text: string; className: string } => {
    const normalizedStatus = status.toLowerCase().trim();
    
    switch (normalizedStatus) {
      case 'completed':
        return {
          text: 'Completed',
          className: 'bg-green-100 text-green-800'
        };
      case 'in progress':
      case 'in_progress':
      case 'ongoing':
        return {
          text: 'In Progress',
          className: 'bg-blue-100 text-blue-800'
        };
      case 'pending':
        return {
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-800'
        };
      case 'active':
        return {
          text: 'Active',
          className: 'bg-green-100 text-green-800'
        };
      case 'cancelled':
      case 'canceled':
        return {
          text: 'Cancelled',
          className: 'bg-red-100 text-red-800'
        };
      case 'accepted':
        return {
          text: 'Accepted',
          className: 'bg-purple-100 text-purple-800'
        };
      default:
        return {
          text: status || 'Unknown',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  }
};

// Rating formatting utilities
export const formatRating = {
  /**
   * Format rating number with proper decimals
   */
  number: (rating: number | null | undefined): string => {
    if (rating === null || rating === undefined || isNaN(rating)) return '0.0';
    return rating.toFixed(1);
  },

  /**
   * Generate star rating display data
   */
  stars: (rating: number | null | undefined): { filled: number; total: number } => {
    const numRating = rating || 0;
    return {
      filled: Math.floor(numRating),
      total: 5
    };
  }
};

// Error message standardization
export const formatError = {
  /**
   * Standardize error messages for user-facing display
   */
  userFriendly: (context: string): string => {
    return `Unable to ${context.toLowerCase()}. Please try again.`;
  },

  /**
   * Standardize console error logging
   */
  log: (error: any, context: string): void => {
    console.error(`Error in ${context}:`, error);
  }
};