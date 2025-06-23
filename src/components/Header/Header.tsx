import React, { useState, useEffect } from "react";
import { formatUser } from "../../utils/formatters";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { 
  BellIcon,
  WalletIcon,
  UserIcon,
  ChevronDownIcon,
  LogOutIcon,
  CheckCircleIcon
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { WalletStatusNotification } from "../WalletStatusNotification/WalletStatusNotification";

interface HeaderProps {
  title: string;
  userType?: 'buyer' | 'seller';
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  userType = "seller"
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showWalletStatus, setShowWalletStatus] = useState(false);
  const navigate = useNavigate();
  const { user, logout, ethAddress } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const userName = formatUser.displayName(user, 'User');

  useEffect(() => {
    if (user?.id) {
      console.log('Header: User authenticated, loading notifications for:', user.id);
      loadNotifications();
      loadUnreadCount();
    } else {
      console.log('Header: No user authenticated, skipping notification load');
      // Clear notifications when no user
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id, userType]);

  const loadNotifications = async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping notifications load');
      return;
    }
    
    setLoadingNotifications(true);
    try {
      const data = await api.notifications.getUserNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.log('Failed to load notifications:', error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const loadUnreadCount = async () => {
    if (!user?.id) {
      console.log('No user ID available, skipping unread count load');
      return;
    }
    
    try {
      const count = await api.notifications.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.log('Failed to load unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.notifications.markAsRead(notificationId);
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Use only real notifications from API
  const displayNotifications = notifications;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowWalletStatus(!showWalletStatus)}
              title="Wallet"
              className={`flex items-center gap-2 border rounded-full px-4 py-2 hover:bg-gray-50 ${!!ethAddress ? 'border-amber-300 bg-amber-50' : 'border-gray-300 bg-gray-50'}`}
            >
              <WalletIcon className={`w-5 h-5 ${!!ethAddress ? 'text-amber-500' : 'text-gray-500'}`} />
              <span className="font-medium">Wallet</span>
              {!!ethAddress && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
            </Button>
            
            {showWalletStatus && (
              <WalletStatusNotification 
                isEnabled={!!ethAddress} 
                walletBalance="1,250.00"
              />
            )}
          </div>
          
          {/* Notifications Dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative"
            >
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? (
                    <span className="text-[8px] text-white font-bold">9+</span>
                  ) : (
                    <span className="text-[8px] text-white font-bold">{unreadCount}</span>
                  )}
                </div>
              )}
            </Button>
            
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="p-4 text-center text-gray-500">Loading notifications...</div>
                  ) : displayNotifications.length > 0 ? (
                    displayNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          if (!notification.read && notification.id) {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="font-medium text-gray-900">
                          {notification.title || notification.message}
                        </div>
                        <div className="text-sm text-gray-500">
                          {notification.time || new Date(notification.created_at).toLocaleString()}
                        </div>
                        {!notification.read && (
                          <div className="text-xs text-blue-600 mt-1">● Unread</div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">No notifications</div>
                  )}
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
                <Link 
                  to="/#" 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                >
                  Wallet
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <LogOutIcon className="w-4 h-4" />
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