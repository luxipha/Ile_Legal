import React from 'react';
import { MessageContainer } from '../../components/Messaging/MessageContainer';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from '../../components/Header/Header';
import { BuyerSidebar } from '../../components/BuyerSidebar/BuyerSidebar';

export const BuyerMessages: React.FC = () => {
  const { user } = useAuth();

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
      <BuyerSidebar activePage="messages" />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-16 md:pt-0 pb-20 md:pb-0">
        {/* Header - Only show on desktop */}
        <div className="hidden md:block">
          <Header title="Messages" userType="buyer" />
        </div>
        
        {/* Message Container - Edge to edge on mobile */}
        <div className="flex-1 md:p-6">
          <MessageContainer
            userId={user.id}
            userType="buyer"
            className="h-full bg-white md:rounded-lg md:shadow overflow-hidden"
            onConversationSelect={(conversation) => {
              console.log('Selected conversation:', conversation);
            }}
          />
        </div>
      </div>
    </div>
  );
};
