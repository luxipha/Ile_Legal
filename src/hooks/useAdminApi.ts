// React hooks for Admin API operations

import { useState, useEffect, useCallback } from 'react';
import { AdminApiService } from '../services/adminApi';
import {
  UserProfile,
  UserWithAuth,
  UserDocument,
  UserListResponse,
  UserStats,
  GetUsersParams,
  VerifyUserRequest,
  RejectUserRequest,
  RequestInfoRequest,
  UpdateDocumentStatusRequest,
  AdminDashboardStats
} from '../types/admin';

// Generic hook state interface
interface ApiHookState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Users list hook
export const useUsers = (params: GetUsersParams = {}) => {
  const [state, setState] = useState<ApiHookState<UserListResponse>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchUsers = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await AdminApiService.getUsers(params);
      
      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({ 
          data: null, 
          loading: false, 
          error: response.error?.message || 'Failed to fetch users' 
        });
      }
    } catch (error: any) {
      setState({ 
        data: null, 
        loading: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    ...state,
    refetch: fetchUsers
  };
};

// Single user hook
export const useUser = (userId: string | null) => {
  const [state, setState] = useState<ApiHookState<UserProfile>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await AdminApiService.getUserById(userId);
      
      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({ 
          data: null, 
          loading: false, 
          error: response.error?.message || 'Failed to fetch user' 
        });
      }
    } catch (error: any) {
      setState({ 
        data: null, 
        loading: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  }, [userId]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    ...state,
    refetch: fetchUser
  };
};

// User documents hook
export const useUserDocuments = (userId: string | null) => {
  const [state, setState] = useState<ApiHookState<UserDocument[]>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchDocuments = useCallback(async () => {
    if (!userId) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await AdminApiService.getUserDocuments(userId);
      
      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({ 
          data: null, 
          loading: false, 
          error: response.error?.message || 'Failed to fetch documents' 
        });
      }
    } catch (error: any) {
      setState({ 
        data: null, 
        loading: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  }, [userId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    ...state,
    refetch: fetchDocuments
  };
};

// User stats hook
export const useUserStats = () => {
  const [state, setState] = useState<ApiHookState<UserStats>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchStats = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await AdminApiService.getUserStats();
      
      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({ 
          data: null, 
          loading: false, 
          error: response.error?.message || 'Failed to fetch stats' 
        });
      }
    } catch (error: any) {
      setState({ 
        data: null, 
        loading: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...state,
    refetch: fetchStats
  };
};

// Dashboard stats hook
export const useDashboardStats = () => {
  const [state, setState] = useState<ApiHookState<AdminDashboardStats>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchStats = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await AdminApiService.getDashboardStats();
      
      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({ 
          data: null, 
          loading: false, 
          error: response.error?.message || 'Failed to fetch dashboard stats' 
        });
      }
    } catch (error: any) {
      setState({ 
        data: null, 
        loading: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    ...state,
    refetch: fetchStats
  };
};

// Pending verifications hook
export const usePendingVerifications = (limit: number = 10) => {
  const [state, setState] = useState<ApiHookState<UserWithAuth[]>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchPending = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await AdminApiService.getPendingVerifications(limit);
      
      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({ 
          data: null, 
          loading: false, 
          error: response.error?.message || 'Failed to fetch pending verifications' 
        });
      }
    } catch (error: any) {
      setState({ 
        data: null, 
        loading: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  }, [limit]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  return {
    ...state,
    refetch: fetchPending
  };
};

// Admin actions hook (for mutations)
export const useAdminActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyUser = useCallback(async (request: VerifyUserRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AdminApiService.verifyUser(request);
      
      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to verify user');
        setLoading(false);
        throw new Error(response.error?.message || 'Failed to verify user');
      }
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  }, []);

  const rejectUser = useCallback(async (request: RejectUserRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AdminApiService.rejectUser(request);
      
      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to reject user');
        setLoading(false);
        throw new Error(response.error?.message || 'Failed to reject user');
      }
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  }, []);

  const requestUserInfo = useCallback(async (request: RequestInfoRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AdminApiService.requestInfo(request);
      
      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to request user info');
        setLoading(false);
        throw new Error(response.error?.message || 'Failed to request user info');
      }
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  }, []);

  const updateDocumentStatus = useCallback(async (request: UpdateDocumentStatusRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AdminApiService.updateDocumentStatus(request);
      
      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to update document status');
        setLoading(false);
        throw new Error(response.error?.message || 'Failed to update document status');
      }
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  }, []);

  const bulkVerifyUsers = useCallback(async (userIds: string[], adminId: string, notes?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AdminApiService.bulkVerifyUsers(userIds, adminId, notes);
      
      if (response.success) {
        setLoading(false);
        return response.data;
      } else {
        setError(response.error?.message || 'Failed to bulk verify users');
        setLoading(false);
        throw new Error(response.error?.message || 'Failed to bulk verify users');
      }
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  }, []);

  return {
    loading,
    error,
    verifyUser,
    rejectUser,
    requestUserInfo,
    updateDocumentStatus,
    bulkVerifyUsers,
    clearError: () => setError(null)
  };
};

// Search hook
export const useUserSearch = () => {
  const [state, setState] = useState<ApiHookState<UserWithAuth[]>>({
    data: null,
    loading: false,
    error: null
  });

  const searchUsers = useCallback(async (query: string, limit: number = 20) => {
    if (!query.trim()) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await AdminApiService.searchUsers(query, limit);
      
      if (response.success && response.data) {
        setState({ data: response.data, loading: false, error: null });
      } else {
        setState({ 
          data: null, 
          loading: false, 
          error: response.error?.message || 'Failed to search users' 
        });
      }
    } catch (error: any) {
      setState({ 
        data: null, 
        loading: false, 
        error: error.message || 'An unexpected error occurred' 
      });
    }
  }, []);

  const clearSearch = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    searchUsers,
    clearSearch
  };
};