import React, { useState } from 'react';
import { Menu, Bell, User, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

type HeaderProps = {
  setSidebarOpen: (open: boolean) => void;
};

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate('/');
    logout();
    
  };

  // Mock notifications
  const notifications = [
    {
      id: 1,
      message: 'New bid received on your gig',
      time: '2 hours ago',
      unread: true,
    },
    {
      id: 2,
      message: 'Payment received',
      time: '5 hours ago',
      unread: false,
    },
  ];

  // Get the correct profile path based on user role
  const getProfilePath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'buyer': return '/buyer/profile';
      case 'seller': return '/seller/profile';
      case 'admin': return '/admin/profile';
      default: return '/profile';
    }
  };
  
  return (
    <header className="bg-white shadow-sm z-10 sticky top-0">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="lg:hidden -ml-0.5 -mt-0.5 h-10 w-10 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        
        <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
          <div className="max-w-lg w-full">
            <h1 className="text-xl font-semibold text-primary-500 hidden md:block">
              {user?.role === 'buyer' ? 'Buyer Dashboard' : 
               user?.role === 'seller' ? 'Legal Professional Dashboard' : 
               user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Wallet Section */}
          <Link
            to={`/${user?.role}/payments`}
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <CreditCard className="h-6 w-6" />
            <span className="ml-2 text-sm font-medium hidden md:block">Wallet</span>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error-500 ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                  <div className="mt-2 divide-y divide-gray-200">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="py-3">
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center max-w-xs rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white">
                <User className="h-5 w-5" />
              </div>
              <span className="ml-2 text-sm font-medium hidden md:block">{user?.name || 'User'}</span>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <Link
                    to={getProfilePath()}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Your Profile
                  </Link>
                  <Link
                    to={`/${user?.role}/payments`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Wallet & Payments
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {handleLogout();}}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;