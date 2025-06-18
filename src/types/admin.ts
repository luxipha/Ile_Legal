// TypeScript types for Admin User Management APIs

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: 'id_card' | 'passport' | 'drivers_license' | 'professional_license' | 'certificate' | 'other';
  document_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role: 'buyer' | 'seller' | 'admin';
  verification_status: 'pending' | 'verified' | 'rejected' | 'info_requested';
  verified_at?: string;
  verified_by?: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  verification_notes?: string;
  info_requested_at?: string;
  requested_info?: string;
  created_at: string;
  updated_at?: string;
  // Circle wallet fields
  circle_wallet_id?: string;
  circle_wallet_address?: string;
  circle_wallet_created_at?: string;
  circle_wallet_status?: string;
  // Additional profile fields
  phone?: string;
  location?: string;
  bio?: string;
  profile_picture?: string;
  documents?: UserDocument[];
}

export interface UserWithAuth extends UserProfile {
  auth: {
    id: string;
    email: string;
    created_at: string;
    email_confirmed_at?: string;
  };
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: 'info_request' | 'verification_update' | 'document_status' | 'general';
  title: string;
  message: string;
  requested_info?: string;
  is_read: boolean;
  created_by?: string;
  created_at: string;
  read_at?: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: 'user_verified' | 'user_rejected' | 'info_requested' | 'document_verified' | 'gig_flagged' | 'gig_suspended' | 'dispute_resolved' | 'user_suspended';
  target_id: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface UserListResponse {
  users: UserWithAuth[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

// API Request/Response types
export interface VerifyUserRequest {
  userId: string;
  adminId: string;
  notes?: string;
}

export interface RejectUserRequest {
  userId: string;
  adminId: string;
  reason: string;
  notes?: string;
}

export interface RequestInfoRequest {
  userId: string;
  adminId: string;
  requestedInfo: string;
  message: string;
}

export interface UpdateDocumentStatusRequest {
  userId: string;
  documentId: string;
  status: 'pending' | 'approved' | 'rejected';
  adminId: string;
  notes?: string;
}

// Filter and pagination types
export interface UserFilters {
  status?: 'pending' | 'verified' | 'rejected';
  role?: 'buyer' | 'seller' | 'admin';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface GetUsersParams extends UserFilters, PaginationParams {}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Admin dashboard types
export interface AdminDashboardStats {
  users: UserStats;
  gigs: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    flagged: number;
  };
  disputes: {
    total: number;
    pending: number;
    inReview: number;
    resolved: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
}

// Document upload types
export interface DocumentUpload {
  file: File;
  document_type: UserDocument['document_type'];
  document_name: string;
}

export interface DocumentUploadResponse {
  document: UserDocument;
  uploadUrl?: string;
}