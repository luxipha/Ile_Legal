import React from "react";
import { Button } from "../../components/ui/button";
import { ArrowLeftIcon, PhoneIcon, VideoIcon, MoreVerticalIcon } from "lucide-react";

interface ChatHeaderProps {
  name: string;
  avatar: string;
  online: boolean;
  onBackClick: () => void;
  gigTitle?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  name,
  avatar,
  online,
  onBackClick,
  gigTitle
}) => {
  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="mr-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <div className="relative">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
              {avatar}
            </div>
            {online && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">
              {online ? 'Online' : 'Last seen recently'}
            </p>
            {gigTitle && (
              <p className="text-xs text-blue-600">{gigTitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <PhoneIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <VideoIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVerticalIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
