import { useState } from "react";
import { Button } from "../ui/button";
import { 
  BellIcon,
  UserIcon,
  ChevronDownIcon
} from "lucide-react";

type ViewMode = "dashboard" | "verify-user" | "manage-gigs" | "disputes" | "settings" | "profile" | "view-gig-details" | "view-user-details";

interface AdminHeaderMenuProps {
  title: string;
  onNavigate: (viewMode: ViewMode) => void;
}

type Notification = {
  id: number;
  title: string;
  time: string;
  read: boolean;
};

export const AdminHeaderMenu = ({ title, onNavigate }: AdminHeaderMenuProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Sample notifications - in a real app, these would come from props or context
  const notifications: Notification[] = [
    {
      id: 1,
      title: "New user verification request",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      title: "Dispute escalated to admin",
      time: "5 hours ago",
      read: true
    }
  ];

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <BellIcon className="w-5 h-5" />
              {notifications.some(n => !n.read) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                      <div className="font-medium text-gray-900">{notification.title}</div>
                      <div className="text-sm text-gray-500">{notification.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-gray-600">Demo Admin</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </Button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button 
                  onClick={() => {
                    onNavigate("profile");
                    setShowProfileDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  Your Profile
                </button>
                <button 
                  onClick={() => {
                    onNavigate("settings");
                    setShowProfileDropdown(false);
                  }}
                  className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  Settings
                </button>
                <button className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
