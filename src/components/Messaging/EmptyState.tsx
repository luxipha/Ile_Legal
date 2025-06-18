import React from "react";
import { MessageSquareIcon } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "Select a conversation",
  description = "Choose a conversation from the list to start messaging"
}) => {
  return (
    <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
      <div className="text-center">
        <MessageSquareIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};
