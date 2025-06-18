import React from "react";

export interface ConversationItemProps {
  id: number | string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatar: string;
  online: boolean;
  isSelected: boolean;
  gigTitle?: string;
  onClick: () => void;
}

export const ConversationListItem: React.FC<ConversationItemProps> = ({
  name,
  lastMessage,
  timestamp,
  unread,
  avatar,
  online,
  isSelected,
  gigTitle,
  onClick
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
        isSelected ? "bg-blue-50 border border-blue-200" : "border border-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
            {avatar}
          </div>
          {online && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
            <span className="text-xs text-gray-500">{timestamp}</span>
          </div>
          {gigTitle && (
            <p className="text-xs text-blue-600 mb-1 truncate">{gigTitle}</p>
          )}
          <p className="text-sm text-gray-600 truncate">{lastMessage}</p>
        </div>
        
        {unread && (
          <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
        )}
      </div>
    </div>
  );
};
