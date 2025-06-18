# User Management APIs Documentation

This document provides comprehensive documentation for the User Management APIs implemented for the Ile Legal platform admin functionality.

## Overview

The User Management APIs provide administrators with complete control over user verification, document management, and user lifecycle operations. These APIs are designed to handle the verification process for legal professionals and clients on the platform.

## API Endpoints

### 1. Get All Users
**Endpoint:** `GET /api/admin/users`

**Description:** Retrieve all users with optional filtering and pagination.

**Parameters:**
- `status` (optional): Filter by verification status (`pending`, `verified`, `rejected`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of users per page (default: 20)

**Response:**
```typescript
{
  users: UserWithAuth[],
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

**Usage:**
```typescript
import { AdminApiService } from '../services/adminApi';

const response = await AdminApiService.getUsers({
  status: 'pending',
  page: 1,
  limit: 20
});
```

### 2. Get User by ID
**Endpoint:** `GET /api/admin/users/:id`

**Description:** Retrieve specific user details including documents.

**Parameters:**
- `userId`: User ID (required)

**Response:**
```typescript
UserProfile & {
  documents: UserDocument[]
}
```

**Usage:**
```typescript
const response = await AdminApiService.getUserById('user-id-123');
```

### 3. Verify User
**Endpoint:** `PUT /api/admin/users/:id/verify`

**Description:** Verify a user's account.

**Parameters:**
- `userId`: User ID (required)
- `adminId`: Admin performing the action (required)
- `notes`: Optional verification notes

**Response:**
```typescript
UserProfile
```

**Usage:**
```typescript
const response = await AdminApiService.verifyUser({
  userId: 'user-id-123',
  adminId: 'admin-id-456',
  notes: 'All documents verified successfully'
});
```

### 4. Reject User
**Endpoint:** `PUT /api/admin/users/:id/reject`

**Description:** Reject a user's verification with a reason.

**Parameters:**
- `userId`: User ID (required)
- `adminId`: Admin performing the action (required)
- `reason`: Rejection reason (required)
- `notes`: Optional additional notes

**Response:**
```typescript
UserProfile
```

**Usage:**
```typescript
const response = await AdminApiService.rejectUser({
  userId: 'user-id-123',
  adminId: 'admin-id-456',
  reason: 'Incomplete documentation',
  notes: 'Professional license document is missing'
});
```

### 5. Request Additional Information
**Endpoint:** `POST /api/admin/users/:id/request-info`

**Description:** Request additional information from a user.

**Parameters:**
- `userId`: User ID (required)
- `adminId`: Admin performing the action (required)
- `requestedInfo`: Description of required information (required)
- `message`: Message to the user (required)

**Response:**
```typescript
UserNotification
```

**Usage:**
```typescript
const response = await AdminApiService.requestUserInfo({
  userId: 'user-id-123',
  adminId: 'admin-id-456',
  requestedInfo: 'Updated professional license',
  message: 'Please upload your current professional license as the one provided has expired.'
});
```

### 6. Get User Documents
**Endpoint:** `GET /api/admin/users/:id/documents`

**Description:** Retrieve all documents uploaded by a user.

**Parameters:**
- `userId`: User ID (required)

**Response:**
```typescript
UserDocument[]
```

**Usage:**
```typescript
const response = await AdminApiService.getUserDocuments('user-id-123');
```

### 7. Update Document Status
**Endpoint:** `PUT /api/admin/users/:id/documents/:docId/status`

**Description:** Update the verification status of a specific document.

**Parameters:**
- `userId`: User ID (required)
- `documentId`: Document ID (required)
- `status`: New status (`pending`, `approved`, `rejected`) (required)
- `adminId`: Admin performing the action (required)
- `notes`: Optional notes for rejection

**Response:**
```typescript
UserDocument
```

**Usage:**
```typescript
const response = await AdminApiService.updateDocumentStatus({
  userId: 'user-id-123',
  documentId: 'doc-id-789',
  status: 'approved',
  adminId: 'admin-id-456'
});
```

## Database Schema

### Tables Created

#### 1. profiles (extended)
Added verification-related columns:
- `verification_status`: ENUM ('pending', 'verified', 'rejected', 'info_requested')
- `verified_at`: TIMESTAMPTZ
- `verified_by`: UUID (references auth.users)
- `rejected_at`: TIMESTAMPTZ
- `rejected_by`: UUID (references auth.users)
- `rejection_reason`: TEXT
- `verification_notes`: TEXT
- `info_requested_at`: TIMESTAMPTZ
- `requested_info`: TEXT

#### 2. user_documents
Stores user verification documents:
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `document_type`: ENUM ('id_card', 'passport', 'drivers_license', 'professional_license', 'certificate', 'other')
- `document_name`: TEXT
- `file_path`: TEXT
- `file_size`: INTEGER
- `mime_type`: TEXT
- `verification_status`: ENUM ('pending', 'approved', 'rejected')
- `verified_at`: TIMESTAMPTZ
- `verified_by`: UUID (foreign key to auth.users)
- `rejection_reason`: TEXT
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

#### 3. user_notifications
Stores admin-user communications:
- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users)
- `type`: ENUM ('info_request', 'verification_update', 'document_status', 'general')
- `title`: TEXT
- `message`: TEXT
- `requested_info`: TEXT
- `is_read`: BOOLEAN
- `created_by`: UUID (foreign key to auth.users)
- `created_at`: TIMESTAMPTZ
- `read_at`: TIMESTAMPTZ

#### 4. admin_actions
Audit log for admin actions:
- `id`: UUID (primary key)
- `admin_id`: UUID (foreign key to auth.users)
- `action_type`: ENUM ('user_verified', 'user_rejected', 'info_requested', 'document_verified', 'gig_flagged', 'gig_suspended', 'dispute_resolved', 'user_suspended')
- `target_id`: UUID
- `details`: JSONB
- `created_at`: TIMESTAMPTZ

## React Hooks

The implementation includes custom React hooks for easy integration:

### useUsers
Fetch and manage users list with filtering and pagination.

```typescript
const { data, loading, error, refetch } = useUsers({
  status: 'pending',
  page: 1,
  limit: 20
});
```

### useUser
Fetch individual user details.

```typescript
const { data, loading, error, refetch } = useUser(userId);
```

### useUserDocuments
Fetch user's documents.

```typescript
const { data, loading, error, refetch } = useUserDocuments(userId);
```

### useAdminActions
Perform admin actions (verify, reject, etc.).

```typescript
const {
  loading,
  error,
  verifyUser,
  rejectUser,
  requestUserInfo,
  updateDocumentStatus
} = useAdminActions();
```

### usePendingVerifications
Fetch pending verification requests.

```typescript
const { data, loading, error, refetch } = usePendingVerifications(10);
```

## Security Features

### Row Level Security (RLS)
All tables implement RLS policies:
- Users can only access their own data
- Admins can access all data
- Proper role-based access control

### Audit Logging
All admin actions are logged in the `admin_actions` table for compliance and monitoring.

### Data Validation
Strict type checking and validation at both API and database levels.

## Error Handling

All APIs return standardized error responses:

```typescript
{
  success: boolean,
  data?: T,
  error?: {
    message: string,
    code?: string,
    details?: any
  }
}
```

## Usage Examples

### Admin Dashboard Integration

```typescript
import { useUsers, useUserStats, useAdminActions } from '../hooks/useAdminApi';

function AdminDashboard() {
  const { data: users, loading, refetch } = useUsers({ status: 'pending' });
  const { data: stats } = useUserStats();
  const { verifyUser, rejectUser } = useAdminActions();

  const handleVerify = async (userId: string) => {
    try {
      await verifyUser({
        userId,
        adminId: currentAdmin.id,
        notes: 'Verified successfully'
      });
      refetch(); // Refresh the list
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  // Component JSX...
}
```

### Document Review Component

```typescript
import { useUserDocuments, useAdminActions } from '../hooks/useAdminApi';

function DocumentReview({ userId }: { userId: string }) {
  const { data: documents, loading, refetch } = useUserDocuments(userId);
  const { updateDocumentStatus } = useAdminActions();

  const handleApproveDocument = async (documentId: string) => {
    try {
      await updateDocumentStatus({
        userId,
        documentId,
        status: 'approved',
        adminId: currentAdmin.id
      });
      refetch();
    } catch (error) {
      console.error('Document approval failed:', error);
    }
  };

  // Component JSX...
}
```

## Migration Instructions

1. **Run the migration:**
   ```bash
   supabase migration up
   ```

2. **Update existing profiles:**
   ```sql
   UPDATE profiles SET verification_status = 'pending' WHERE verification_status IS NULL;
   ```

3. **Set up admin users:**
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email IN ('admin@ile-legal.com');
   ```

## Performance Considerations

- All tables have appropriate indexes for common queries
- Pagination is implemented to handle large datasets
- RLS policies are optimized for performance
- Bulk operations are available for admin efficiency

## Future Enhancements

1. **Real-time notifications** using Supabase realtime subscriptions
2. **Advanced search** with full-text search capabilities
3. **Document OCR** for automatic data extraction
4. **Automated verification** using AI/ML for document validation
5. **Compliance reporting** with detailed audit trails
6. **Multi-level approval** workflows for complex verification processes

## Testing

The APIs include comprehensive error handling and should be tested with:
- Valid and invalid user IDs
- Different admin permission levels
- Edge cases (missing documents, invalid statuses)
- Bulk operations with large datasets
- Concurrent admin actions

## Support

For questions or issues with the User Management APIs, please refer to:
- API documentation in the codebase
- Supabase documentation for database operations
- React hooks documentation for frontend integration