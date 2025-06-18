// components/messaging/MessageContainer.tsx
import React, { useCallback } from 'react';
import { useMessageService } from '../../hooks/useMessageService';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from '../ui/ErrorDisplay';
import { EmptyState } from './EmptyState';
import { MessageContainerProps } from './types/messaging';

export const MessageContainer: React.FC<MessageContainerProps> = React.memo(({
  userId,
  userType,
  className = '',
  onConversationSelect
}) => {
  // Enhanced debugging
  console.log('MessageContainer rendering with:', { 
    userId, 
    userType, 
    className,
    hasOnConversationSelect: !!onConversationSelect,
    onConversationSelectType: typeof onConversationSelect
  });

  try {
    const {
      conversations,
      selectedConversation,
      messages,
      isLoading,
      isLoadingMessages,
      isSending,
      error,
      loadConversations,
      selectConversation,
      sendMessage,
      clearError
    } = useMessageService(userId, userType);

    console.log('useMessageService returned:', {
      conversationsCount: conversations?.length,
      hasSelectedConversation: !!selectedConversation,
      messagesCount: messages?.length,
      isLoading,
      error
    });

    // ✅ FIXED: Stable callback with useCallback
    const handleConversationSelect = useCallback((conversation: any) => {
      selectConversation(conversation);
      onConversationSelect?.(conversation);
    }, [selectConversation, onConversationSelect]);

    // Handle retry on error
    const handleRetry = useCallback(() => {
      clearError();
      loadConversations();
    }, [clearError, loadConversations]);

    return (
      <div className={`flex flex-col md:flex-row h-full ${className}`}>
        <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="medium" />
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorDisplay
                error={error}
                onRetry={handleRetry}
              />
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelect={handleConversationSelect}
              isLoading={isLoading}
            />
          )}
        </div>

        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              messages={messages}
              currentUserId={userId}
              onSendMessage={sendMessage}
              isLoading={isLoadingMessages}
              isSending={isSending}
            />
          ) : (
            <EmptyState
              title="Select a Conversation"
              description="Choose a conversation from the left to start messaging"
            />
          )}
        </div>

        <div className="md:hidden">
          {/* Mobile layout placeholder */}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in MessageContainer:', error);
    return (
      <div className="flex items-center justify-center h-full flex-col">
        <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">There was an error loading the messaging interface</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }
}, (prevProps, nextProps) => {
  // ✅ FIXED: More lenient comparison - ignore function changes if other props are same
  const userIdChanged = prevProps.userId !== nextProps.userId;
  const userTypeChanged = prevProps.userType !== nextProps.userType;
  const classNameChanged = prevProps.className !== nextProps.className;
  
  // Only check if critical props changed
  const criticalPropsChanged = userIdChanged || userTypeChanged || classNameChanged;
  
  if (criticalPropsChanged) {
    console.log('🔄 Critical props changed, re-rendering:', {
      userId: userIdChanged ? `${prevProps.userId} → ${nextProps.userId}` : 'same',
      userType: userTypeChanged ? `${prevProps.userType} → ${nextProps.userType}` : 'same',
      className: classNameChanged ? `${prevProps.className} → ${nextProps.className}` : 'same'
    });
    return false; // Re-render
  } else {
    console.log('✅ Critical props are identical, skipping re-render');
    return true; // Don't re-render
  }
});