// components/messaging/MessageActions.tsx
import React from 'react';
import { MessageActionsProps, MessageAction } from './types/messaging';

export const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  onAction,
  availableActions = ['copy', 'delete']
}) => {
  const actionIcons: Record<MessageAction, string> = {
    copy: '📋',
    delete: '🗑️',
    reply: '↩️',
    forward: '➡️'
  };

  const actionLabels: Record<MessageAction, string> = {
    copy: 'Copy',
    delete: 'Delete',
    reply: 'Reply',
    forward: 'Forward'
  };

  const handleAction = (action: MessageAction) => {
    onAction({
      action,
      messageId: message.id,
      conversationId: message.id // This would need to be passed properly from parent
    });
  };

  return (
    <div className="absolute top-0 right-0 transform translate-x-full -translate-y-2">
      <div className="flex bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {availableActions.map((action) => (
          <button
            key={action}
            onClick={() => handleAction(action)}
            className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center space-x-1"
            title={actionLabels[action]}
          >
            <span>{actionIcons[action]}</span>
            <span className="hidden md:inline">{actionLabels[action]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};