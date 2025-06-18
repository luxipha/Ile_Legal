import { supabaseLocal as supabase } from '../lib/supabaseLocal';
import { User } from '../types/auth';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  has_attachment: boolean;
  attachment_type: string | null;
  attachment_url: string | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  buyer_id: string;
  seller_id: string;
  gig_id: string | null;
  last_message_id: string | null;
  buyer_unread_count: number;
  seller_unread_count: number;
  buyer: User;
  seller: User;
  last_message?: Message;
}

export interface ConversationWithParticipants extends Conversation {
  buyer: User;
  seller: User;
  gig?: any;
}

export const messagingService = {
  /**
   * Get all conversations for a user
   * @param userId Current user ID
   * @param userType Whether the user is a 'buyer' or 'seller'
   */
  // Replace your existing getConversations property with this:
getConversations: async (userId: string, userType: 'buyer' | 'seller') => {
  try {
    console.log('[messagingService] Loading conversations for:', userId, 'as', userType);
    
    // First, get conversations without complex joins to avoid relationship errors
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        created_at,
        updated_at,
        buyer_id,
        seller_id,
        gig_id,
        last_message_id,
        buyer_unread_count,
        seller_unread_count
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[messagingService] Error loading conversations:', error);
      throw new Error(error.message);
    }

    if (!conversations || conversations.length === 0) {
      console.log('[messagingService] No conversations found');
      return [];
    }

    // Get all unique user IDs
    const userIds = Array.from(new Set([
      ...conversations.map(c => c.buyer_id),
      ...conversations.map(c => c.seller_id)
    ])).filter(Boolean);

    // Fetch user profiles separately to avoid relationship conflicts
    let userProfiles: any[] = [];
    
    try {
      // Try profiles table first (if it exists)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, email')
        .in('id', userIds);
      
      if (!profileError && profiles && profiles.length > 0) {
        userProfiles = profiles;
        console.log('[messagingService] Loaded user profiles from profiles table');
      } else {
        // If profiles table doesn't exist or is empty, create minimal user objects
        console.log('[messagingService] Profiles table not available, using minimal user data');
        userProfiles = userIds.map(id => ({
          id,
          first_name: '',
          last_name: '',
          full_name: 'User',
          avatar_url: null,
          email: ''
        }));
      }
    } catch (profileError) {
      console.error('[messagingService] Error fetching user profiles:', profileError);
      // Create minimal user objects as fallback
      userProfiles = userIds.map(id => ({
        id,
        first_name: '',
        last_name: '',
        full_name: 'User',
        avatar_url: null,
        email: ''
      }));
    }

    // Fetch last messages for conversations that have them
    const messageIds = conversations
      .map(c => c.last_message_id)
      .filter(Boolean);
    
    let lastMessages: any[] = [];
    if (messageIds.length > 0) {
      try {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id, content, created_at, sender_id, has_attachment, attachment_type, attachment_url')
          .in('id', messageIds);
        
        if (!messagesError) {
          lastMessages = messages || [];
        }
      } catch (messageError) {
        console.error('[messagingService] Error fetching last messages:', messageError);
      }
    }

    // Combine everything
    const enrichedConversations = conversations.map(conversation => {
      const buyer = userProfiles.find(u => u.id === conversation.buyer_id);
      const seller = userProfiles.find(u => u.id === conversation.seller_id);
      const lastMessage = lastMessages.find(m => m.id === conversation.last_message_id);

      return {
        ...conversation,
        buyer: buyer || { 
          id: conversation.buyer_id, 
          full_name: 'Unknown Buyer',
          first_name: '',
          last_name: '',
          avatar_url: null,
          email: ''
        },
        seller: seller || { 
          id: conversation.seller_id, 
          full_name: 'Unknown Seller',
          first_name: '',
          last_name: '',
          avatar_url: null,
          email: ''
        },
        last_message: lastMessage || null
      };
    });

    // Fetch gigs for conversations that have them (optional)
    const conversationsWithGigs = await Promise.all(
      enrichedConversations.map(async (conversation) => {
        if (conversation.gig_id) {
          try {
            const { data: gig, error: gigError } = await supabase
              .from('gigs')
              .select('id, title, description')
              .eq('id', conversation.gig_id)
              .single();
            
            if (!gigError && gig) {
              return { ...conversation, gig };
            }
          } catch (gigError) {
            console.error('[messagingService] Error fetching gig:', gigError);
          }
        }
        return conversation;
      })
    );

    console.log('[messagingService] Successfully loaded conversations:', conversationsWithGigs.length);
    return conversationsWithGigs;

  } catch (error) {
    console.error('[messagingService] Failed to load conversations:', error);
    throw error;
  }
},
/// delete from here
  /**
   * Get a single conversation by ID
   * @param conversationId Conversation ID
   */
  getConversation: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        buyer:profiles!buyer_id(id, first_name, last_name, avatar_url),
        seller:profiles!seller_id(id, first_name, last_name, avatar_url),
        gig:gigs(id, title, description)
      `)
      .eq('id', conversationId)
      .single();
    
    if (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
    
    // Transform the data to create full_name
    const transformedData = {
      ...data,
      buyer: data.buyer ? {
        ...data.buyer,
        full_name: `${data.buyer.first_name || ''} ${data.buyer.last_name || ''}`.trim() || 'Unknown User'
      } : null,
      seller: data.seller ? {
        ...data.seller,
        full_name: `${data.seller.first_name || ''} ${data.seller.last_name || ''}`.trim() || 'Unknown User'
      } : null
    };
    
    return transformedData;
  },
  
  /**
   * Get or create a conversation between a buyer and seller
   * @param buyerId Buyer user ID
   * @param sellerId Seller user ID
   * @param gigId Optional gig ID
   */
  getOrCreateConversation: async (buyerId: string, sellerId: string, gigId?: string) => {
    // First try to find existing conversation
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId)
      .is('gig_id', gigId || null)
      .single();
    
    if (existingConversation) {
      return existingConversation;
    }
    
    // If no conversation exists, create one
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        gig_id: gigId || null
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating conversation:', createError);
      throw createError;
    }
    
    return newConversation;
  },
  
  /**
   * Get all messages in a conversation
   * @param conversationId Conversation ID
   */
  getMessages: async (conversationId: string) => {
    console.log(`[messagingService] Getting messages for conversation: ${conversationId}`);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      
      console.log(`[messagingService] Messages query result:`, { 
        success: !error, 
        count: data?.length || 0,
        conversationId,
        errorCode: error?.code,
        errorMessage: error?.message
      });
      
      if (error) {
        console.error('[messagingService] Error fetching messages:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error(`[messagingService] Exception in getMessages for conversation ${conversationId}:`, err);
      throw err;
    }
  },
  
  /**
   * Send a message in a conversation
   * @param conversationId Conversation ID
   * @param senderId Sender ID
   * @param content Message content
   * @param file Optional file attachment
   */
  sendMessage: async (conversationId: string, senderId: string, content: string, file?: File) => {
    console.log(`[messagingService] Sending message to conversation ${conversationId} from ${senderId}`, {
      contentLength: content?.length || 0,
      hasFile: !!file,
      fileName: file?.name
    });
    
    let attachment_url = null;
    let fileName = null;
    
    // If there's a file, upload it first
    if (file) {
      console.log(`[messagingService] Uploading file attachment: ${file.name}, size: ${file.size} bytes`);
      const fileExt = file.name.split('.').pop();
      const filePath = `${conversationId}/${Date.now()}.${fileExt}`;
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(filePath, file);
        
        console.log(`[messagingService] File upload result:`, { 
          success: !uploadError, 
          fileName: file.name,
          filePath
        });
        
        if (uploadError) {
          console.error('[messagingService] Error uploading file:', uploadError);
          throw uploadError;
        }
        
        console.log('[messagingService] File uploaded successfully:', uploadData);
        
        // Get the public URL
        const { data: { publicUrl } } = await supabase.storage
          .from('message-attachments')
          .getPublicUrl(filePath);
        
        attachment_url = publicUrl;
        fileName = file.name;
        console.log(`[messagingService] File public URL generated: ${publicUrl}`);
      } catch (err) {
        console.error('[messagingService] Exception during file upload:', err);
        throw err;
      }
    }
    
    // Use the stored procedure to send the message
    console.log('[messagingService] Calling send_message RPC with params:', {
      conversationId,
      senderId,
      contentLength: content?.length || 0,
      hasAttachment: !!attachment_url
    });
    
    try {
      const { data, error } = await supabase.rpc('send_message', {
        p_conversation_id: conversationId,
        p_sender_id: senderId,
        p_content: content,
        p_attachment_url: attachment_url,
        p_attachment_type: file?.type || null,
        p_has_attachment: !!attachment_url,
        p_file_name: fileName
      });
      
      console.log(`[messagingService] Message send result:`, { 
        success: !error, 
        messageId: data?.id || 'unknown'
      });
      
      if (error) {
        console.error('[messagingService] Error sending message:', error);
        throw error;
      }
      
      // Return the newly created message
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', data)
        .single();
      
      console.log(`[messagingService] Message fetch result:`, { 
        success: !messageError, 
        messageId: messageData?.id || 'unknown'
      });
      
      if (messageError) {
        console.error('Error fetching sent message:', messageError);
        throw messageError;
      }
      
      return messageData;
    } catch (err) {
      console.error('[messagingService] Exception in sendMessage:', err);
      throw err;
    }
  },

  /**
   * Mark messages as read
   * @param conversationId Conversation ID
   * @param userId User ID
   * @param userType Whether the user is a 'buyer' or 'seller'
   */
  markAsRead: async (conversationId: string, userId: string, userType: 'buyer' | 'seller') => {
    console.log(`[messagingService] Marking messages as read for conversation ${conversationId}`, {
      userId,
      userType
    });
    
    try {
      const { error } = await supabase.rpc('mark_messages_read', {
        p_conversation_id: conversationId,
        p_user_id: userId,
      });
      
      console.log(`[messagingService] Mark as read result:`, { 
        success: !error, 
        conversationId,
        userId,
        userType
      });
      
      if (error) {
        console.error('[messagingService] Error marking messages as read:', error);
        throw error;
      }
      
      console.log(`[messagingService] Successfully marked messages as read for conversation ${conversationId}`);
    } catch (err) {
      console.error('[messagingService] Exception in markAsRead:', err);
      throw err;
    }
  },

  /**
   * Subscribe to new messages in a conversation
   * @param conversationId Conversation ID
   * @param callback Function to call when new messages arrive
   */
  subscribeToMessages: (conversationId: string, callback: (payload: any) => void) => {
    console.log(`[messagingService] Setting up subscription for messages in conversation ${conversationId}`);
    
    try {
      const subscription = supabase
        .channel(`messages:${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          console.log(`[messagingService] New message received in conversation ${conversationId}:`, {
            messageId: payload.new?.id,
            senderId: payload.new?.sender_id,
            timestamp: new Date().toISOString()
          });
          callback(payload.new);
        })
        .subscribe();
      
      console.log(`[messagingService] Successfully subscribed to messages for conversation ${conversationId}`);
      return subscription;
    } catch (err) {
      console.error(`[messagingService] Error setting up message subscription for conversation ${conversationId}:`, err);
      throw err;
    }
  },

  /**
   * Subscribe to conversation updates
   * @param userId User ID to filter conversations by
   * @param callback Function to call when conversations are updated
   */
  subscribeToConversations: (userId: string, callback: (payload: any) => void) => {
    console.log(`[messagingService] Setting up subscription for conversations for user ${userId}`);
    
    try {
      const subscription = supabase
        .channel(`user_conversations:${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_id=eq.${userId}`
        }, (payload) => {
          const newData = payload.new as Record<string, any> | null;
          console.log(`[messagingService] Conversation update for user ${userId} (as buyer):`, {
            conversationId: newData?.id || 'unknown',
            event: payload.eventType,
            timestamp: new Date().toISOString()
          });
          callback(payload.new as any);
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `seller_id=eq.${userId}`
        }, (payload) => {
          const newData = payload.new as Record<string, any> | null;
          console.log(`[messagingService] Conversation update for user ${userId} (as seller):`, {
            conversationId: newData?.id || 'unknown',
            event: payload.eventType,
            timestamp: new Date().toISOString()
          });
          callback(payload.new as any);
        })
        .subscribe();
      
      console.log(`[messagingService] Successfully subscribed to conversations for user ${userId}`);
      return subscription;
    } catch (err) {
      console.error(`[messagingService] Error setting up conversation subscription for user ${userId}:`, err);
      throw err;
    }
  },

  /**
   * Get the total number of unread messages for a user
   * @param userId User ID
   * @param userType Whether the user is a 'buyer' or 'seller'
   */
  getUnreadCount: async (userId: string, userType: 'buyer' | 'seller') => {
    console.log(`[messagingService] Getting unread count for user ${userId} as ${userType}`);
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(userType === 'buyer' ? 'buyer_unread_count' : 'seller_unread_count')
        .eq(userType === 'buyer' ? 'buyer_id' : 'seller_id', userId);
      
      console.log(`[messagingService] Unread count query result:`, { 
        success: !error, 
        userId,
        userType,
        count: data?.length || 0
      });
      
      if (error) {
        console.error('[messagingService] Error fetching unread count:', error);
        throw error;
      }
      
      // Sum up all unread counts
      const totalUnread = data.reduce((total, conversation) => {
        // Type-safe approach using type assertion
        const unreadCount = userType === 'buyer' 
          ? (conversation as { buyer_unread_count: number }).buyer_unread_count 
          : (conversation as { seller_unread_count: number }).seller_unread_count;
        return total + (unreadCount || 0);
      }, 0);
      
      console.log(`[messagingService] Total unread messages for user ${userId}: ${totalUnread}`);
      return totalUnread;
    } catch (err) {
      console.error('[messagingService] Exception in getUnreadCount:', err);
      throw err;
    }
  }
};

export default messagingService;