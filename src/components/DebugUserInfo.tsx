import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const DebugUserInfo: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <h3 className="text-red-800 font-semibold">❌ No User Authenticated</h3>
        <p className="text-red-600 text-sm">Please login to view reputation data</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="text-blue-800 font-semibold mb-2">🔍 Debug: User Info</h3>
      <div className="text-sm space-y-1">
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Verified:</strong> {user.isVerified ? '✅' : '❌'}</p>
      </div>
    </div>
  );
};

export default DebugUserInfo;