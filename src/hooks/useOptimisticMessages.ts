// hooks/useOptimisticMessages.ts
import { useState, useCallback } from 'react';
import { 
  UIMessage, 
  OptimisticMessage, 
  UseOptimisticMessagesReturn 
} from '../components/Messaging/types/messaging';

export const useOptimisticMessages = (): UseOptimisticMessagesReturn => {
  const [messages, setMessages] = useState<UIMessage[]>([]);

  // Add an optimistic message that shows immediately
  const addOptimisticMessage = useCallback((content: string, file?: File): OptimisticMessage => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const optimisticMessage: OptimisticMessage = {
      id: tempId,
      tempId,
      content,
      timestamp: new Date().toISOString(),
      isSent: true,
      isRead: false,
      hasAttachment: !!file,
      attachmentType: file?.type,
      sending: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    
    console.log('[useOptimisticMessages] Added optimistic message:', tempId);
    return optimisticMessage;
  }, []);

  // Confirm optimistic message with real message data
  const confirmMessage = useCallback((tempId: string, realMessage: UIMessage) => {
    setMessages(prev => 
      prev.map(msg => 
        'tempId' in msg && msg.tempId === tempId 
          ? { 
              ...realMessage,
              // Preserve any UI-specific properties that might be needed
              id: realMessage.id,
              timestamp: realMessage.timestamp
            }
          : msg
      )
    );
    
    console.log('[useOptimisticMessages] Confirmed message:', tempId, '→', realMessage.id);
  }, []);

  // Mark optimistic message as failed
  const failMessage = useCallback((tempId: string, error?: string) => {
    setMessages(prev => 
      prev.map(msg => 
        'tempId' in msg && msg.tempId === tempId 
          ? { 
              ...msg, 
              sending: false, 
              failed: true,
              // Optionally store error message
              ...(error && { error })
            } as UIMessage
          : msg
      )
    );
    
    console.log('[useOptimisticMessages] Failed message:', tempId, error);
  }, []);

  // Remove a message (for failed messages or user deletion)
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => 
      prev.filter(msg => {
        // Remove by actual ID or temp ID
        if ('tempId' in msg) {
          return msg.tempId !== messageId && msg.id !== messageId;
        }
        return msg.id !== messageId;
      })
    );
    
    console.log('[useOptimisticMessages] Removed message:', messageId);
  }, []);

  // Set messages (for initial load or refresh)
  const setMessagesWrapper = useCallback((newMessages: UIMessage[]) => {
    setMessages(newMessages);
    console.log('[useOptimisticMessages] Set messages:', newMessages.length);
  }, []);

  return {
    messages,
    addOptimisticMessage,
    confirmMessage,
    failMessage,
    removeMessage,
    setMessages: setMessagesWrapper
  };
};