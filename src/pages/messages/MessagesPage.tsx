import React from 'react';
import { useParams } from 'react-router-dom';
import ChatInterface from '../../components/messaging/ChatInterface';

const MessagesPage: React.FC = () => {
  const { conversationId } = useParams();
  
  // If no conversation is selected, show the conversations list
  if (!conversationId) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>
        <div className="bg-white shadow-card rounded-lg">
          <div className="p-6">
            <p className="text-gray-500 text-center">Select a conversation to start messaging</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Messages</h1>
      <ChatInterface 
        recipientId="demo-recipient"
        conversationId={conversationId}
      />
    </div>
  );
};

export default MessagesPage;