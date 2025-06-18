import React from "react";
import { FileTextIcon } from "lucide-react";

export interface MessageProps {
  id: number | string;
  content: string;
  senderId: string;
  timestamp: string;
  isCurrentUser: boolean;
  type?: "text" | "file";
  fileName?: string;
  attachment_url?: string;
}

export const MessageBubble: React.FC<MessageProps> = ({
  content,
  isCurrentUser,
  timestamp,
  type,
  fileName,
  attachment_url
}) => {
  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isCurrentUser
            ? "bg-[#1B1828] text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        {type === "file" ? (
          <div className="flex items-center gap-2">
            <FileTextIcon className="w-4 h-4 text-[#FEC85F]" />
            <a 
              href={attachment_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm underline"
            >
              {fileName || content}
            </a>
          </div>
        ) : (
          <p className="text-sm">{content}</p>
        )}
        <p
          className={`text-xs mt-1 ${
            isCurrentUser ? "text-gray-300" : "text-gray-500"
          }`}
        >
          {timestamp}
        </p>
      </div>
    </div>
  );
};
