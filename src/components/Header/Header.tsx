import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { 
  BellIcon,
  CreditCardIcon,
  UserIcon,
  ChevronDownIcon
} from "lucide-react";

interface HeaderProps {
  title: string;
  userName?: string;
  userType?: 'buyer' | 'seller';
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  userName = "Demo Seller", 
  userType = "seller"
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Role-based notifications
  const buyerNotifications = [
    {
      id: 1,
      title: "Provider accepted your gig request",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      title: "New message from provider",
      time: "5 hours ago",
      read: true
    },
    {
      id: 3,
      title: "Payment confirmation for Land Title Verification",
      time: "1 day ago",
      read: true
    }
  ];

  const sellerNotifications = [
    {
      id: 1,
      title: "New bid opportunity available",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      title: "Client reviewed your work",
      time: "5 hours ago",
      read: true
    },
    {
      id: 3,
      title: "Payment received for Legal Consultation",
      time: "1 day ago",
      read: true
    }
  ];

  // Select notifications based on user type
  const notifications = userType === 'buyer' ? buyerNotifications : sellerNotifications;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <CreditCardIcon className="w-5 h-5 mr-2" />
          </Button>
          
          {/* Notifications Dropdown */}
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
              <span className="text-sm text-gray-600">{userName}</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </Button>

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <Link 
                  to={userType === 'buyer' ? '/buyer-profile' : '/profile'} 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  Your Profile
                </Link>
                <Link 
                  to={userType === 'buyer' ? '/payments' : '/earnings'} 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  {userType === 'buyer' ? 'Payments' : 'Earnings'}
                </Link>
                <button className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50">
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