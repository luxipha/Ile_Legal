
export interface MessageUser {
    id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar_url: string | null;
  }
  
  export interface DatabaseMessage {
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
  
  export interface DatabaseConversation {
    id: string;
    created_at: string;
    updated_at: string;
    buyer_id: string;
    seller_id: string;
    gig_id: string | null;
    last_message_id: string | null;
    buyer_unread_count: number;
    seller_unread_count: number;
    buyer: MessageUser;
    seller: MessageUser;
    last_message?: DatabaseMessage;
    gig?: {
      id: string;
      title: string;
      description: string;
    };
  }
  
  // UI-optimized interfaces
  export interface UIMessage {
    id: string;
    content: string;
    timestamp: string;
    isSent: boolean; // true if current user sent it
    isRead: boolean;
    hasAttachment: boolean;
    attachmentType?: string;
    attachmentUrl?: string;
    sending?: boolean; // for optimistic updates
    failed?: boolean; // for failed messages
    tempId?: string; // for tracking optimistic messages
  }
  
  export interface UIConversation {
    id: string;
    participantName: string;
    participantAvatar: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    isOnline?: boolean;
    gigTitle?: string;
    participantId: string;
  }
  
  export interface ConversationFilters {
    search?: string;
    unreadOnly?: boolean;
    gigId?: string;
  }
  
  export interface MessageSendPayload {
    conversationId: string;
    content: string;
    file?: File;
  }
  
  export interface OptimisticMessage extends UIMessage {
    tempId: string;
    sending: true;
  }
  
  export interface MessageSubscriptionPayload {
    conversationId: string;
    userId: string;
    userType: 'buyer' | 'seller';
  }
  
  export interface ConversationSubscriptionPayload {
    userId: string;
    userType: 'buyer' | 'seller';
  }
  
  export interface MessageServiceState {
    conversations: UIConversation[];
    selectedConversation: UIConversation | null;
    messages: UIMessage[];
    isLoading: boolean;
    isLoadingMessages: boolean;
    isSending: boolean;
    error: string | null;
    unreadCount: number;
  }
  
  export interface MessageServiceActions {
    loadConversations: () => Promise<void>;
    selectConversation: (conversation: UIConversation) => Promise<void>;
    sendMessage: (payload: MessageSendPayload) => Promise<void>;
    markAsRead: (conversationId: string) => Promise<void>;
    refreshConversations: () => Promise<void>;
    clearError: () => void;
  }
  
  export type UserType = 'buyer' | 'seller';
  
  // Utility type for transforming database data to UI data
  export interface DataTransformers {
    conversationToUI: (
      dbConversation: DatabaseConversation, 
      currentUserId: string
    ) => UIConversation;
    messageToUI: (
      dbMessage: DatabaseMessage, 
      currentUserId: string
    ) => UIMessage;
  }
  
  // Real-time subscription types
  export interface MessageSubscription {
    conversationId: string;
    unsubscribe: () => void;
  }
  
  export interface ConversationSubscription {
    userId: string;
    unsubscribe: () => void;
  }
  
  // File attachment types
  export interface FileAttachment {
    file: File;
    preview?: string; // for images
    type: 'image' | 'document' | 'other';
  }
  
  export interface FileUploadProgress {
    fileName: string;
    progress: number; // 0-100
    status: 'uploading' | 'completed' | 'failed';
  }
  
  // Typing indicator types
  export interface TypingUser {
    userId: string;
    userName: string;
    conversationId: string;
    timestamp: number;
  }
  
  // Search types
  export interface ConversationSearchResult extends UIConversation {
    matchType: 'participant' | 'message' | 'gig';
    snippet?: string;
  }
  
  // Message actions
  export type MessageAction = 'copy' | 'delete' | 'reply' | 'forward';
  
  export interface MessageActionPayload {
    action: MessageAction;
    messageId: string;
    conversationId: string;
  }
  
  // Error types
  export interface MessageError {
    code: string;
    message: string;
    details?: any;
    retryable?: boolean;
  }
  
  // Hook return types
  export interface UseMessageServiceReturn extends MessageServiceState, MessageServiceActions {}
  
  export interface UseOptimisticMessagesReturn {
    messages: UIMessage[];
    addOptimisticMessage: (content: string, file?: File) => OptimisticMessage;
    confirmMessage: (tempId: string, realMessage: UIMessage) => void;
    failMessage: (tempId: string, error?: string) => void;
    removeMessage: (messageId: string) => void;
    setMessages: (messages: UIMessage[]) => void;
  }
  
  export interface UseMessageSubscriptionsReturn {
    subscribeToMessages: (conversationId: string, callback: (message: DatabaseMessage) => void) => void;
    subscribeToConversations: (callback: (conversation: DatabaseConversation) => void) => void;
    unsubscribeFromMessages: (conversationId: string) => void;
    unsubscribeFromAll: () => void;
  }
  
  // Component prop types
  export interface MessageContainerProps {
    userId: string;
    userType: UserType;
    className?: string;
    onConversationSelect?: (conversation: UIConversation) => void;
  }
  
  export interface ConversationListProps {
    conversations: UIConversation[];
    selectedConversation: UIConversation | null;
    onSelect: (conversation: UIConversation) => void;
    isLoading: boolean;
    filters?: ConversationFilters;
    onFiltersChange?: (filters: ConversationFilters) => void;
  }
  
  export interface MessageThreadProps {
    conversation: UIConversation | null;
    messages: UIMessage[];
    currentUserId: string;
    onSendMessage: (payload: MessageSendPayload) => Promise<void>;
    isLoading: boolean;
    isSending: boolean;
  }
  
  export interface MessageInputProps {
    conversationId: string;
    onSend: (payload: MessageSendPayload) => Promise<void>;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
    allowAttachments?: boolean;
  }
  
  export interface FileAttachmentPreviewProps {
    file: File;
    onRemove: () => void;
    uploadProgress?: FileUploadProgress;
  }
  
  export interface MessageTypingIndicatorProps {
    typingUsers: TypingUser[];
    conversationId: string;
    currentUserId: string;
  }
  
  export interface UnreadMessageIndicatorProps {
    count: number;
    onClick?: () => void;
    className?: string;
  }
  
  export interface MessageActionsProps {
    message: UIMessage;
    onAction: (payload: MessageActionPayload) => void;
    availableActions?: MessageAction[];
  }
  
  export interface ConversationSearchProps {
    conversations: UIConversation[];
    onResultSelect: (conversation: UIConversation) => void;
    placeholder?: string;
    maxResults?: number;
  }