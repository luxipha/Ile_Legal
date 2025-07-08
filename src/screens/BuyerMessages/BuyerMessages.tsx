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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header title="Messages" userType="buyer" />
        
        {/* Message Container */}
        <div className="flex-1 p-4 sm:p-6">
          <MessageContainer
            userId={user.id}
            userType="buyer"
            className="h-full bg-white rounded-lg shadow"
            onConversationSelect={(conversation) => {
              console.log('Selected conversation:', conversation);
            }}
          />
        </div>
      </div>
    </div>
  );
};
