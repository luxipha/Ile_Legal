// components/messaging/MessageThread.tsx
import React, { useEffect, useRef } from 'react';
import { MessageInput } from './MessageInput';
import { MessageActions } from './MessageActions';
import { MessageTypingIndicator } from './MessageTypingIndicator';
import { MessageThreadProps, UIMessage, MessageActionPayload } from './types/messaging';
import { format, isToday, isYesterday } from 'date-fns';

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  isLoading,
  isSending,
  onBack,
  isMobile = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMessageAction = (payload: MessageActionPayload) => {
    switch (payload.action) {
      case 'copy':
        const message = messages.find(m => m.id === payload.messageId);
        if (message) {
          navigator.clipboard.writeText(message.content);
        }
        break;
      case 'delete':
        // Handle delete - would need to be implemented in the service
        console.log('Delete message:', payload.messageId);
        break;
      case 'reply':
        // Handle reply - could scroll to input and pre-fill
        console.log('Reply to message:', payload.messageId);
        break;
      default:
        console.log('Unhandled message action:', payload.action);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: UIMessage[] }, message) => {
    const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const formatDateHeader = (dateKey: string) => {
    const date = new Date(dateKey);
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM dd, yyyy');
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`${isMobile ? 'p-3' : 'p-3 sm:p-4'} border-b border-gray-200 bg-white`}>
        <div className="flex items-center space-x-3">
          {/* Mobile back button */}
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <img
            src={conversation.participantAvatar}
            alt={conversation.participantName}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.participantName)}&background=random`;
            }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{conversation.participantName}</h3>
            {conversation.gigTitle && (
              <p className="text-xs sm:text-sm text-blue-600 truncate">📋 {conversation.gigTitle}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4"
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
              <div key={dateKey} className="space-y-4">
                {/* Date header */}
                <div className="flex justify-center">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {formatDateHeader(dateKey)}
                  </span>
                </div>
                
                {/* Messages for this date */}
                {dayMessages.map((message, index) => {
                  const isConsecutive = index > 0 && 
                    dayMessages[index - 1].isSent === message.isSent &&
                    new Date(message.timestamp).getTime() - new Date(dayMessages[index - 1].timestamp).getTime() < 300000; // 5 minutes
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isConsecutive={isConsecutive}
                      formatTime={formatMessageTime}
                      onAction={handleMessageAction}
                    />
                  );
                })}
              </div>
            ))}
            
            {/* Typing indicator */}
            <MessageTypingIndicator
              typingUsers={[]} // Would be populated from real-time data
              conversationId={conversation.id}
              currentUserId={currentUserId}
            />
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white">
        <MessageInput
          conversationId={conversation.id}
          onSend={onSendMessage}
          disabled={isSending}
          placeholder={`Message ${conversation.participantName}...`}
          allowAttachments={true}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
};

// Individual message bubble component
interface MessageBubbleProps {
  message: UIMessage;
  isConsecutive: boolean;
  formatTime: (timestamp: string) => string;
  onAction: (payload: MessageActionPayload) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isConsecutive,
  formatTime,
  onAction
}) => {
  const [showActions, setShowActions] = React.useState(false);

  return (
    <div className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`group relative max-w-[75%] sm:max-w-xs lg:max-w-md ${isConsecutive ? 'mt-1' : 'mt-3 sm:mt-4'}`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        onTouchStart={() => setShowActions(true)}
      >
        <div
          className={`rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base break-words ${
            message.isSent
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          } ${message.sending ? 'opacity-70' : ''} ${message.failed ? 'bg-red-100 text-red-700 border border-red-200' : ''}`}
        >
          {message.content}
          
          {/* Attachment */}
          {message.hasAttachment && message.attachmentUrl && (
            <div className="mt-2">
              {message.attachmentType?.startsWith('image/') ? (
                <img
                  src={message.attachmentUrl}
                  alt="Attachment"
                  className="max-w-full h-auto rounded"
                />
              ) : (
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded"
                >
                  <span>📎</span>
                  <span className="text-sm">View attachment</span>
                </a>
              )}
            </div>
          )}
          
          {/* Status indicators */}
          <div className={`flex items-center justify-end mt-1 space-x-1 text-xs ${
            message.isSent ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.timestamp)}</span>
            {message.isSent && (
              <span>{message.isRead ? '✓✓' : '✓'}</span>
            )}
            {message.sending && <span>⏳</span>}
            {message.failed && <span className="text-red-500">⚠️</span>}
          </div>
        </div>

        {/* Message Actions */}
        {showActions && !message.sending && (
          <MessageActions
            message={message}
            onAction={onAction}
            availableActions={['copy', 'delete']}
          />
        )}
      </div>
    </div>
  );
};