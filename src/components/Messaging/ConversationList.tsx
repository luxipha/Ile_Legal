// components/messaging/ConversationList.tsx
import React, { useState } from 'react';
import { ConversationSearch } from './ConversationSearch';
import { UnreadMessageIndicator } from './UnreadMessageIndicator';
import { ConversationListProps, ConversationFilters } from './types/messaging';
import { formatDistanceToNow } from 'date-fns';

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversation,
  onSelect,
  isLoading,
  filters,
  onFiltersChange
}) => {
  const [localFilters, setLocalFilters] = useState<ConversationFilters>(filters || {});

  // Filter conversations based on search and filters
  const filteredConversations = conversations.filter(conversation => {
    // Search filter
    if (localFilters.search) {
      const searchLower = localFilters.search.toLowerCase();
      const matchesParticipant = conversation.participantName.toLowerCase().includes(searchLower);
      const matchesMessage = conversation.lastMessage.toLowerCase().includes(searchLower);
      const matchesGig = conversation.gigTitle?.toLowerCase().includes(searchLower);
      
      if (!matchesParticipant && !matchesMessage && !matchesGig) {
        return false;
      }
    }

    // Unread only filter
    if (localFilters.unreadOnly && conversation.unreadCount === 0) {
      return false;
    }

    // Gig filter
    if (localFilters.gigId && conversation.gigTitle !== localFilters.gigId) {
      return false;
    }

    return true;
  });

  const handleFiltersChange = (newFilters: ConversationFilters) => {
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filters */}
      <div className="p-3 border-b border-gray-100">
        <ConversationSearch
          conversations={conversations}
          onResultSelect={onSelect}
          placeholder="Search conversations..."
        />
        
        {/* Filter buttons */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleFiltersChange({ ...localFilters, unreadOnly: !localFilters.unreadOnly })}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              localFilters.unreadOnly
                ? 'bg-blue-100 text-blue-700 border-blue-200'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            Unread Only {totalUnread > 0 && `(${totalUnread})`}
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Loading conversations...
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {localFilters.search || localFilters.unreadOnly ? 
              'No conversations match your filters' : 
              'No conversations yet'
            }
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isSelected={selectedConversation?.id === conversation.id}
                onClick={() => onSelect(conversation)}
                formatTimestamp={formatTimestamp}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Individual conversation item component
interface ConversationItemProps {
  conversation: any;
  isSelected: boolean;
  onClick: () => void;
  formatTimestamp: (timestamp: string) => string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  onClick,
  formatTimestamp
}) => {
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`p-4 cursor-pointer transition-colors relative ${
        isSelected
          ? 'bg-blue-50 border-r-2 border-blue-500'
          : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <img
            src={conversation.participantAvatar}
            alt={conversation.participantName}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.participantName)}&background=random`;
            }}
          />
          {conversation.isOnline && (
            <div className="absolute w-3 h-3 bg-green-400 border-2 border-white rounded-full -mt-1 ml-7"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-medium truncate ${
              isSelected ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {conversation.participantName}
            </h3>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">
                {formatTimestamp(conversation.timestamp)}
              </span>
              {conversation.unreadCount > 0 && (
                <UnreadMessageIndicator count={conversation.unreadCount} />
              )}
            </div>
          </div>
          
          {/* Gig title if available */}
          {conversation.gigTitle && (
            <p className="text-xs text-blue-600 font-medium mb-1">
              📋 {conversation.gigTitle}
            </p>
          )}
          
          {/* Last message */}
          <p className={`text-sm truncate ${
            conversation.unreadCount > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
          }`}>
            {conversation.lastMessage}
          </p>
        </div>
      </div>
    </div>
  );
};