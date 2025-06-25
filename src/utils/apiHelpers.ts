/**
 * Standardized API helpers for consistent error handling and session management
 */

import { formatError } from './formatters';

/**
 * Standardized error handler for API calls
 */
export const handleApiError = (
  error: any, 
  context: string, 
  setError?: (msg: string) => void,
  setData?: (data: any[]) => void
): string => {
  formatError.log(error, context);
  const errorMessage = formatError.userFriendly(context);
  
  if (setError) setError(errorMessage);
  if (setData) setData([]);
  
  return errorMessage;
};

/**
 * Standardized session validation for API calls with retry
 */
export const validateSession = async (maxRetries = 3, delayMs = 100): Promise<boolean> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.log(`Session validation error (attempt ${attempt + 1}):`, error);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        return false;
      }
      
      if (session?.access_token) {
        return true;
      }
      
      // If no session but no error, wait a bit and retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      console.log(`Session validation failed (attempt ${attempt + 1}):`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  return false;
};

/**
 * Standardized loading state management
 */
export const createLoadingStates = <T extends Record<string, boolean>>(
  initialStates: T
): {
  states: T;
  setters: Record<keyof T, (loading: boolean) => void>;
} => {
  const states = { ...initialStates };
  const setters = {} as Record<keyof T, (loading: boolean) => void>;
  
  Object.keys(initialStates).forEach((key) => {
    setters[key as keyof T] = (loading: boolean) => {
      states[key as keyof T] = loading;
    };
  });
  
  return { states, setters };
};

/**
 * Standardized data fetching with error handling
 */
export const fetchWithErrorHandling = async <T>(
  fetchFn: () => Promise<T>,
  context: string,
  setLoading?: (loading: boolean) => void,
  setError?: (error: string) => void,
  setData?: (data: T) => void
): Promise<T | null> => {
  if (setLoading) setLoading(true);
  
  try {
    const result = await fetchFn();
    if (setData) setData(result);
    return result;
  } catch (error) {
    handleApiError(error, context, setError);
    return null;
  } finally {
    if (setLoading) setLoading(false);
  }
};

/**
 * Standardized user session check
 */
export const requireAuth = (user: any, navigate?: (path: string) => void): boolean => {
  if (!user?.id) {
    console.log('User not authenticated');
    if (navigate) navigate('/login');
    return false;
  }
  return true;
};

/**
 * Standardized empty state messages
 */
export const getEmptyStateMessage = (context: string) => {
  const messages: Record<string, { title: string; description: string }> = {
    gigs: {
      title: 'No gigs available',
      description: 'Check back later for new opportunities'
    },
    bids: {
      title: 'No bids yet',
      description: 'Your bids will appear here once submitted'
    },
    reviews: {
      title: 'No reviews yet',
      description: 'Reviews from clients will appear here'
    },
    cases: {
      title: 'No cases yet',
      description: 'Your completed gigs will appear here'
    },
    notifications: {
      title: 'No notifications',
      description: 'You\'ll see notifications here when they arrive'
    },
    messages: {
      title: 'No messages yet',
      description: 'Start a conversation about this gig'
    }
  };
  
  return messages[context] || {
    title: 'No data available',
    description: 'Information will appear here when available'
  };
};