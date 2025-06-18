import React, { useCallback } from 'react';
import { MessageContainer } from '../../components/Messaging/MessageContainer';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/Header/Header';
import { SellerSidebar } from '../../components/SellerSidebar/SellerSidebar';

export const Messages: React.FC = () => {
  console.log('Messages component rendering');
  const { user } = useAuth();
  console.log('User in Messages:', user);

  // ✅ FIXED: Stable function reference using useCallback
  const handleConversationSelect = useCallback((conversation: any) => {
    console.log('Selected conversation:', conversation);
  }, []); // Empty dependency array = function never changes

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to view messages</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <SellerSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header title="Messages" userType="seller" />
        
        {/* Message Container */}
        <div className="flex-1 p-6">
          <MessageContainer
            userId={user.id}
            userType="seller"
            className="h-full bg-white rounded-lg shadow"
            onConversationSelect={handleConversationSelect} // ✅ Stable reference
          />
        </div>
      </div>
    </div>
  );
};