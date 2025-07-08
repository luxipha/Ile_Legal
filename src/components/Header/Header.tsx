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
  CheckCircleIcon,
  MenuIcon,
  XIcon
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import { WalletStatusNotification } from "../WalletStatusNotification/WalletStatusNotification";
import { WalletRetryNotification } from "../WalletRetryNotification/WalletRetryNotification";
import { getUserWalletData } from "../../services/unifiedWalletService";

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [walletData, setWalletData] = useState<{hasWallet: boolean, balance: string} | null>(null);
  
  const userName = formatUser.displayName(user, 'User');

  useEffect(() => {
    if (user?.id) {
      console.log('Header: User authenticated, loading notifications for:', user.id);
      loadNotifications();
      loadUnreadCount();
      loadWalletData();
    } else {
      console.log('Header: No user authenticated, skipping notification load');
      // Clear notifications when no user
      setNotifications([]);
      setUnreadCount(0);
      setWalletData(null);
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

  const loadWalletData = async () => {
    if (!user?.id) {
      console.log('🔍 [Header] No user ID available, skipping wallet data load');
      return;
    }
    
    try {
      console.log('🔍 [Header] Loading wallet data from user_wallets table for user:', user.id);
      const unifiedWalletData = await getUserWalletData(user.id);
      
      const hasWallet = unifiedWalletData.hasEthWallet || unifiedWalletData.hasCircleWallet;
      console.log('✅ [Header] Wallet data loaded:', {
        hasEth: unifiedWalletData.hasEthWallet,
        hasCircle: unifiedWalletData.hasCircleWallet,
        hasWallet,
        balance: unifiedWalletData.balance
      });
      
      setWalletData({
        hasWallet,
        balance: unifiedWalletData.balance
      });
    } catch (error) {
      console.log('⚠️  [Header] Failed to load wallet data:', error);
      setWalletData({ hasWallet: false, balance: '0.00' });
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
    <>
      <header className="hidden md:block bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Title - responsive font size */}
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 truncate">{title}</h1>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowWalletStatus(!showWalletStatus)}
                title="Wallet"
                className={`flex items-center gap-2 border rounded-full px-3 lg:px-4 py-2 hover:bg-gray-50 ${walletData?.hasWallet ? 'border-amber-300 bg-amber-50' : 'border-gray-300 bg-gray-50'}`}
              >
                <WalletIcon className={`w-4 h-4 lg:w-5 lg:h-5 ${walletData?.hasWallet ? 'text-amber-500' : 'text-gray-500'}`} />
                <span className="font-medium text-sm lg:text-base">Wallet</span>
                {walletData?.hasWallet && <CheckCircleIcon className="w-4 h-4 lg:w-5 lg:h-5 text-green-500" />}
              </Button>
              
              {showWalletStatus && (
                <WalletStatusNotification 
                  isEnabled={walletData?.hasWallet || false} 
                  walletBalance={walletData?.balance || "0.00"}
                />
              )}
            </div>
            
            {/* Notifications Dropdown */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2"
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
                <span className="hidden lg:block text-sm text-gray-600">{userName}</span>
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2"
            >
              {showMobileMenu ? (
                <XIcon className="w-5 h-5" />
              ) : (
                <MenuIcon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 border-t border-gray-200 pt-4">
            <div className="space-y-3">
              {/* Mobile Wallet */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowWalletStatus(!showWalletStatus);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full justify-start gap-2 border rounded-lg px-4 py-3 hover:bg-gray-50 ${walletData?.hasWallet ? 'border-amber-300 bg-amber-50' : 'border-gray-300 bg-gray-50'}`}
                >
                  <WalletIcon className={`w-5 h-5 ${walletData?.hasWallet ? 'text-amber-500' : 'text-gray-500'}`} />
                  <span className="font-medium">Wallet</span>
                  {walletData?.hasWallet && <CheckCircleIcon className="w-5 h-5 text-green-500 ml-auto" />}
                </Button>
              </div>

              {/* Mobile Notifications */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowMobileMenu(false);
                }}
                className="w-full justify-start gap-2 px-4 py-3"
              >
                <BellIcon className="w-5 h-5" />
                <span className="font-medium">Notifications</span>
                {unreadCount > 0 && (
                  <div className="ml-auto w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </div>
                )}
              </Button>

              {/* Mobile Profile Links */}
              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{userName}</span>
                  </div>
                </div>
                
                <Link 
                  to={userType === 'buyer' ? '/buyer-profile' : '/profile'} 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Your Profile
                </Link>
                <Link 
                  to={userType === 'buyer' ? '/payments' : '/earnings'} 
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setShowMobileMenu(false)}
                >
                  {userType === 'buyer' ? 'Payments' : 'Earnings'}
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-2 rounded-lg"
                >
                  <LogOutIcon className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      {/* Mobile Notifications Dropdown */}
      {showNotifications && (
        <div className="md:hidden mx-4 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
                    setShowNotifications(false);
                  }}
                >
                  <div className="font-medium text-gray-900 text-sm">
                    {notification.title || notification.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
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
      
      {/* Wallet Setup Notification for users with pending wallet creation */}
      <WalletRetryNotification className="mx-4 sm:mx-6 mt-4" />
    </>
  );
};