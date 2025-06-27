import { messagingService } from './messagingService';
import { supabase } from '../lib/supabase';

export interface DisputeMessage {
  recipient: "buyer" | "seller" | "both";
  subject: string;
  message: string;
}

export const disputeMessagingService = {
  /**
   * Send a message from admin to dispute parties
   * @param disputeId Dispute ID
   * @param adminId Admin user ID
   * @param messageData Message details
   */
  sendDisputeMessage: async (disputeId: number, adminId: string, messageData: DisputeMessage) => {
    try {
      // Get dispute details first
      const { data: dispute, error: disputeError } = await supabase
        .from('Disputes')
        .select('buyer_id, seller_id, gig_id')
        .eq('id', disputeId)
        .single();

      if (disputeError || !dispute) {
        throw new Error('Dispute not found');
      }

      const { buyer_id, seller_id, gig_id } = dispute;
      const recipients = [];

      // Determine recipients based on selection
      if (messageData.recipient === 'buyer' || messageData.recipient === 'both') {
        recipients.push({ userId: buyer_id, role: 'buyer' });
      }
      if (messageData.recipient === 'seller' || messageData.recipient === 'both') {
        recipients.push({ userId: seller_id, role: 'seller' });
      }

      const results = [];

      // Send message to each recipient
      for (const recipient of recipients) {
        try {
          // Create or get conversation between admin and recipient
          const conversation = await messagingService.getOrCreateConversation(
            adminId, // Admin as buyer (initiator)
            recipient.userId, // Party as seller (receiver)
            gig_id // Associated gig
          );

          // Format message with dispute context
          const fullMessage = `**Dispute #${disputeId} - ${messageData.subject}**\n\n${messageData.message}\n\n---\nThis message is regarding your dispute case. Please respond if you have any questions.`;

          // Send the message
          const sentMessage = await messagingService.sendMessage(
            conversation.id,
            adminId,
            fullMessage
          );

          results.push({
            recipient: recipient.role,
            conversationId: conversation.id,
            messageId: sentMessage.id,
            success: true
          });

        } catch (error) {
          console.error(`Failed to send message to ${recipient.role}:`, error);
          results.push({
            recipient: recipient.role,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Error in sendDisputeMessage:', error);
      throw error;
    }
  },

  /**
   * Get all conversations related to a specific dispute
   * @param disputeId Dispute ID
   * @param adminId Admin user ID
   */
  getDisputeConversations: async (disputeId: number, adminId: string) => {
    try {
      // Get dispute details
      const { data: dispute, error: disputeError } = await supabase
        .from('Disputes')
        .select('buyer_id, seller_id, gig_id')
        .eq('id', disputeId)
        .single();

      if (disputeError || !dispute) {
        throw new Error('Dispute not found');
      }

      const { buyer_id, seller_id, gig_id } = dispute;

      // Get conversations between admin and both parties
      const conversations = [];

      // Admin <-> Buyer conversation
      try {
        const buyerConversation = await messagingService.getOrCreateConversation(
          adminId,
          buyer_id,
          gig_id
        );
        const buyerMessages = await messagingService.getMessages(buyerConversation.id);
        conversations.push({
          party: 'buyer',
          conversation: buyerConversation,
          messages: buyerMessages
        });
      } catch (error) {
        console.error('Error getting buyer conversation:', error);
      }

      // Admin <-> Seller conversation
      try {
        const sellerConversation = await messagingService.getOrCreateConversation(
          adminId,
          seller_id,
          gig_id
        );
        const sellerMessages = await messagingService.getMessages(sellerConversation.id);
        conversations.push({
          party: 'seller',
          conversation: sellerConversation,
          messages: sellerMessages
        });
      } catch (error) {
        console.error('Error getting seller conversation:', error);
      }

      return conversations;

    } catch (error) {
      console.error('Error in getDisputeConversations:', error);
      throw error;
    }
  },

  /**
   * Mark dispute-related messages as read
   * @param conversationId Conversation ID
   * @param adminId Admin user ID
   */
  markDisputeMessagesRead: async (conversationId: string, adminId: string) => {
    try {
      await messagingService.markAsRead(conversationId, adminId, 'buyer');
    } catch (error) {
      console.error('Error marking dispute messages as read:', error);
      throw error;
    }
  }
};

export default disputeMessagingService;