// hooks/useMessageSubscriptions.ts
import { useRef, useCallback } from 'react';
import { messagingService } from '../services/messagingService';
import { 
  UseMessageSubscriptionsReturn,
  DatabaseMessage,
  DatabaseConversation
} from '../components/Messaging/types/messaging';

export const useMessageSubscriptions = (): UseMessageSubscriptionsReturn => {
  // Store active subscriptions for cleanup
  const messageSubscriptions = useRef<Map<string, any>>(new Map());
  const conversationSubscription = useRef<any>(null);

  // Subscribe to messages in a specific conversation
  const subscribeToMessages = useCallback((
    conversationId: string, 
    callback: (message: DatabaseMessage) => void
  ) => {
    // Unsubscribe from existing subscription for this conversation
    const existing = messageSubscriptions.current.get(conversationId);
    if (existing) {
      existing.unsubscribe();
    }

    console.log('[useMessageSubscriptions] Subscribing to messages for conversation:', conversationId);

    try {
      const subscription = messagingService.subscribeToMessages(conversationId, callback);
      messageSubscriptions.current.set(conversationId, subscription);
      
      console.log('[useMessageSubscriptions] Successfully subscribed to messages for:', conversationId);
    } catch (error) {
      console.error('[useMessageSubscriptions] Failed to subscribe to messages:', error);
    }
  }, []);

  // Subscribe to conversation updates
  const subscribeToConversations = useCallback((
    callback: (conversation: DatabaseConversation) => void
  ) => {
    // Unsubscribe from existing conversation subscription
    if (conversationSubscription.current) {
      conversationSubscription.current.unsubscribe();
    }

    console.log('[useMessageSubscriptions] Subscribing to conversation updates');

    try {
      // Note: This would need the current user ID - you might want to pass it as parameter
      // For now, assuming the messagingService.subscribeToConversations handles this
      const subscription = messagingService.subscribeToConversations('current-user-id', callback);
      conversationSubscription.current = subscription;
      
      console.log('[useMessageSubscriptions] Successfully subscribed to conversation updates');
    } catch (error) {
      console.error('[useMessageSubscriptions] Failed to subscribe to conversations:', error);
    }
  }, []);

  // Unsubscribe from messages in a specific conversation
  const unsubscribeFromMessages = useCallback((conversationId: string) => {
    const subscription = messageSubscriptions.current.get(conversationId);
    if (subscription) {
      subscription.unsubscribe();
      messageSubscriptions.current.delete(conversationId);
      console.log('[useMessageSubscriptions] Unsubscribed from messages for:', conversationId);
    }
  }, []);

  // Unsubscribe from all subscriptions
  const unsubscribeFromAll = useCallback(() => {
    console.log('[useMessageSubscriptions] Unsubscribing from all subscriptions');

    // Unsubscribe from all message subscriptions
    messageSubscriptions.current.forEach((subscription, conversationId) => {
      subscription.unsubscribe();
      console.log('[useMessageSubscriptions] Unsubscribed from messages for:', conversationId);
    });
    messageSubscriptions.current.clear();

    // Unsubscribe from conversation updates
    if (conversationSubscription.current) {
      conversationSubscription.current.unsubscribe();
      conversationSubscription.current = null;
      console.log('[useMessageSubscriptions] Unsubscribed from conversation updates');
    }
  }, []);

  return {
    subscribeToMessages,
    subscribeToConversations,
    unsubscribeFromMessages,
    unsubscribeFromAll
  };
};