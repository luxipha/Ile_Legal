// components/messaging/MessageTypingIndicator.tsx
import React from 'react';
import { MessageTypingIndicatorProps } from './types/messaging';


export const MessageTypingIndicator: React.FC<MessageTypingIndicatorProps> = ({
  typingUsers,
  conversationId,
  currentUserId
}) => {
  // Filter out current user and users not in this conversation
  const relevantTypingUsers = typingUsers.filter(
    user => user.userId !== currentUserId && user.conversationId === conversationId
  );

  if (relevantTypingUsers.length === 0) return null;

  const getTypingText = () => {
    if (relevantTypingUsers.length === 1) {
      return `${relevantTypingUsers[0].userName} is typing...`;
    } else if (relevantTypingUsers.length === 2) {
      return `${relevantTypingUsers[0].userName} and ${relevantTypingUsers[1].userName} are typing...`;
    } else {
      return 'Multiple people are typing...';
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-500 italic">
      <div className="flex space-x-1">
        <div 
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
          style={{ animationDelay: '0ms' }} 
        />
        <div 
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
          style={{ animationDelay: '150ms' }} 
        />
        <div 
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" 
          style={{ animationDelay: '300ms' }} 
        />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};