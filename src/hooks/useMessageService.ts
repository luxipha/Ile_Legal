// hooks/useMessageService.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { messagingService } from '../services/messagingService';
import { useOptimisticMessages } from './useOptimisticMessages';
import { useMessageSubscriptions } from './useMessageSubscriptions';
import { useToast } from '../components/ui/toast';
import {
  UseMessageServiceReturn,
  UIConversation,
  UIMessage,
  MessageSendPayload,
  UserType,
  DatabaseConversation,
  DatabaseMessage
} from '../components/Messaging/types/messaging';

// Data transformation utilities
const transformConversationToUI = (
  dbConversation: DatabaseConversation,
  currentUserId: string
): UIConversation => {
  const isCurrentUserBuyer = currentUserId === dbConversation.buyer_id;
  const participant = isCurrentUserBuyer ? dbConversation.seller : dbConversation.buyer;
  
  return {
    id: dbConversation.id,
    participantName: participant.full_name,
    participantAvatar: participant.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.full_name)}&background=random`,
    participantId: participant.id,
    lastMessage: dbConversation.last_message?.content || 'No messages yet',
    timestamp: dbConversation.last_message?.created_at || dbConversation.created_at,
    unreadCount: isCurrentUserBuyer ? dbConversation.buyer_unread_count : dbConversation.seller_unread_count,
    gigTitle: dbConversation.gig?.title
  };
};

const transformMessageToUI = (
  dbMessage: DatabaseMessage,
  currentUserId: string
): UIMessage => {
  return {
    id: dbMessage.id,
    content: dbMessage.content,
    timestamp: dbMessage.created_at,
    isSent: dbMessage.sender_id === currentUserId,
    isRead: !!dbMessage.read_at,
    hasAttachment: dbMessage.has_attachment,
    attachmentType: dbMessage.attachment_type || undefined,
    attachmentUrl: dbMessage.attachment_url || undefined
  };
};

export const useMessageService = (
  userId: string,
  userType: UserType
): UseMessageServiceReturn => {
  // Get toast function
  const { addToast } = useToast();
  
  // State
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UIConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Optimistic messages hook
  const {
    messages,
    addOptimisticMessage,
    confirmMessage,
    failMessage,
    setMessages
  } = useOptimisticMessages();

  // Subscriptions hook
  const {
    subscribeToMessages,
    subscribeToConversations,
    unsubscribeFromMessages,
    unsubscribeFromAll
  } = useMessageSubscriptions();

  // Refs for cleanup and stable references
  const currentConversationId = useRef<string | null>(null);
  const userIdRef = useRef(userId);
  const userTypeRef = useRef(userType);
  const messagesRef = useRef<UIMessage[]>([]);
  
  // Update refs when props change
  userIdRef.current = userId;
  userTypeRef.current = userType;
  messagesRef.current = messages;

  // ✅ FIXED: Stable loadConversations with proper dependencies
  const loadConversations = useCallback(async () => {
    const currentUserId = userIdRef.current;
    const currentUserType = userTypeRef.current;
    
    if (!currentUserId) {
      setError('User ID is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useMessageService] Loading conversations for user:', currentUserId, 'as', currentUserType);
      
      const dbConversations = await messagingService.getConversations(currentUserId, currentUserType);
      const uiConversations = dbConversations.map(conv => 
        transformConversationToUI(conv, currentUserId)
      );
      
      setConversations(uiConversations);
      
      // Calculate total unread count
      const totalUnread = uiConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
      
      console.log('[useMessageService] Loaded', uiConversations.length, 'conversations');
      addToast('Conversations loaded', 'success');
      
    } catch (err: any) {
      console.error('[useMessageService] Error loading conversations:', err);
      setError(err.message || 'Failed to load conversations');
      addToast('Failed to load conversations', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]); // Only addToast as dependency

  // ✅ FIXED: Mark as read with stable dependencies
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await messagingService.markAsRead(conversationId, userIdRef.current, userTypeRef.current);
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));

      // Recalculate total unread count - simplified
      setConversations(currentConversations => {
        const conversation = currentConversations.find(c => c.id === conversationId);
        const unreadToSubtract = conversation?.unreadCount || 0;
        setUnreadCount(prev => Math.max(0, prev - unreadToSubtract));
        return currentConversations;
      });

    } catch (err: any) {
      console.error('[useMessageService] Error marking as read:', err);
      // Don't show error toast for this - it's not critical
    }
  }, []); // No dependencies needed - uses refs

  // ✅ FIXED: Select conversation with stable message handling
  const selectConversation = useCallback(async (conversation: UIConversation | null) => {
    if (conversation && selectedConversation?.id === conversation.id) {
      return; // Already selected
    }
    
    if (!conversation) {
      // Deselect conversation
      setSelectedConversation(null);
      setMessages([]);
      return;
    }

    setSelectedConversation(conversation);
    setIsLoadingMessages(true);
    setError(null);

    // Unsubscribe from previous conversation
    if (currentConversationId.current) {
      unsubscribeFromMessages(currentConversationId.current);
    }

    currentConversationId.current = conversation.id;

    try {
      console.log('[useMessageService] Loading messages for conversation:', conversation.id);
      
      // Load messages
      const dbMessages = await messagingService.getMessages(conversation.id);
      const uiMessages = dbMessages.map(msg => transformMessageToUI(msg, userIdRef.current));
      setMessages(uiMessages);

      // Mark as read
      await markAsRead(conversation.id);

      // ✅ FIXED: Subscribe with proper message handling
      subscribeToMessages(conversation.id, (newMessage: DatabaseMessage) => {
        console.log('[useMessageService] Received new message:', newMessage.id);
        const uiMessage = transformMessageToUI(newMessage, userIdRef.current);
        
        // Use ref to get current messages and update with new array
        const currentMessages = messagesRef.current;
        const updatedMessages = [...currentMessages, uiMessage];
        // @ts-ignore
        setMessages(currentMessages => [...currentMessages, uiMessage]);
        
        // Update conversation's last message
        setConversations(prev => prev.map(conv => 
          conv.id === conversation.id 
            ? { ...conv, lastMessage: newMessage.content, timestamp: newMessage.created_at }
            : conv
        ));
      });

      console.log('[useMessageService] Loaded', uiMessages.length, 'messages');
      
    } catch (err: any) {
      console.error('[useMessageService] Error loading messages:', err);
      setError(err.message || 'Failed to load messages');
      addToast('Failed to load messages', 'error');
    } finally {
      setIsLoadingMessages(false);
    }
  }, [selectedConversation?.id, unsubscribeFromMessages, subscribeToMessages, setMessages, markAsRead, addToast]);

  // ✅ FIXED: Send message with proper dependencies
  const sendMessage = useCallback(async (payload: MessageSendPayload) => {
    if (!selectedConversation) {
      throw new Error('No conversation selected');
    }

    setIsSending(true);
    setError(null);

    // Add optimistic message
    const optimisticMessage = addOptimisticMessage(payload.content, payload.file);

    try {
      console.log('[useMessageService] Sending message to conversation:', payload.conversationId);
      
      const sentMessage = await messagingService.sendMessage(
        payload.conversationId,
        userIdRef.current,
        payload.content,
        payload.file
      );

      // Confirm optimistic message with real data
      const uiMessage = transformMessageToUI(sentMessage, userIdRef.current);
      confirmMessage(optimisticMessage.tempId, uiMessage);

      // Update conversation's last message
      setConversations(prev => prev.map(conv => 
        conv.id === payload.conversationId 
          ? { 
              ...conv, 
              lastMessage: payload.content, 
              timestamp: sentMessage.created_at,
              unreadCount: 0 // Reset unread count for current conversation
            }
          : conv
      ));

      console.log('[useMessageService] Message sent successfully:', sentMessage.id);
      
    } catch (err: any) {
      console.error('[useMessageService] Error sending message:', err);
      failMessage(optimisticMessage.tempId, err.message);
      setError(err.message || 'Failed to send message');
      addToast('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  }, [selectedConversation, addOptimisticMessage, confirmMessage, failMessage, addToast]);

  // ✅ FIXED: Stable refresh
  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  // ✅ FIXED: Stable clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✅ FIXED: Handle conversation updates with stable dependencies
  const handleConversationUpdate = useCallback((updatedConversation: DatabaseConversation) => {
    console.log('[useMessageService] Conversation updated:', updatedConversation.id);
    
    const uiConversation = transformConversationToUI(updatedConversation, userIdRef.current);
    
    setConversations(prev => {
      const existingIndex = prev.findIndex(c => c.id === updatedConversation.id);
      if (existingIndex >= 0) {
        // Update existing conversation
        const updated = [...prev];
        updated[existingIndex] = uiConversation;
        return updated;
      } else {
        // Add new conversation
        return [uiConversation, ...prev];
      }
    });

    // Update unread count - simplified
    setConversations(currentConversations => {
      const oldConversation = currentConversations.find(c => c.id === updatedConversation.id);
      const oldUnread = oldConversation?.unreadCount || 0;
      const unreadDiff = uiConversation.unreadCount - oldUnread;
      setUnreadCount(prev => prev + unreadDiff);
      return currentConversations;
    });
  }, []); // No dependencies - uses refs

  // ✅ FIXED: Only run once when userId changes
  useEffect(() => {
    console.log('[useMessageService] Effect: userId changed, loading conversations');
    if (userId) {
      loadConversations();
    }
  }, [userId]); // Remove loadConversations dependency to prevent loops
  
  // ✅ FIXED: Subscription effect with minimal dependencies
  useEffect(() => {
    console.log('[useMessageService] Effect: Setting up subscriptions');
    if (userId) {
      // Subscribe to conversation updates
      subscribeToConversations(handleConversationUpdate);
    }
    
    return () => {
      console.log('[useMessageService] Effect cleanup: Unsubscribing from all');
      unsubscribeFromAll();
    };
  }, [userId]); // Only depend on userId

  return {
    // State
    conversations,
    selectedConversation,
    messages,
    isLoading,
    isLoadingMessages,
    isSending,
    error,
    unreadCount,
    
    // Actions
    loadConversations,
    selectConversation,
    sendMessage,
    markAsRead,
    refreshConversations,
    clearError
  };
};