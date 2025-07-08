import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  BriefcaseIcon, 
  MessageCircleIcon, 
  CreditCardIcon,
  UserIcon,
  ClipboardListIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Don't show mobile nav on auth pages
  if (!user || location.pathname.includes('/login') || location.pathname.includes('/register')) {
    return null;
  }

  const getBuyerNavItems = () => [
    {
      path: '/buyer-dashboard',
      icon: HomeIcon,
      label: 'Dashboard',
      active: location.pathname === '/buyer-dashboard'
    },
    {
      path: '/MyGigs',
      icon: BriefcaseIcon,
      label: 'My Gig',
      active: location.pathname === '/MyGigs'
    },
    {
      path: '/buyer-messages',
      icon: MessageCircleIcon,
      label: 'Messages',
      active: location.pathname === '/buyer-messages'
    },
    {
      path: '/payments',
      icon: CreditCardIcon,
      label: 'Payment',
      active: location.pathname === '/payments'
    }
  ];

  const getSellerNavItems = () => [
    {
      path: '/seller-dashboard',
      icon: HomeIcon,
      label: 'Dashboard',
      active: location.pathname === '/seller-dashboard'
    },
    {
      path: '/active-bids',
      icon: ClipboardListIcon,
      label: 'My Bids',
      active: location.pathname === '/active-bids'
    },
    {
      path: '/seller-messages',
      icon: MessageCircleIcon,
      label: 'Messages',
      active: location.pathname === '/seller-messages' || location.pathname === '/messages'
    },
    {
      path: '/earnings',
      icon: CreditCardIcon,
      label: 'Earnings',
      active: location.pathname === '/earnings'
    }
  ];

  const getAdminNavItems = () => [
    {
      path: '/admin-dashboard',
      icon: HomeIcon,
      label: 'Dashboard',
      active: location.pathname === '/admin-dashboard'
    },
    {
      path: '/admin/users',
      icon: UserIcon,
      label: 'Users',
      active: location.pathname === '/admin/users'
    },
    {
      path: '/admin/payments',
      icon: CreditCardIcon,
      label: 'Payments',
      active: location.pathname === '/admin/payments'
    },
    {
      path: '/profile',
      icon: UserIcon,
      label: 'Profile',
      active: location.pathname === '/profile'
    }
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case 'buyer':
        return getBuyerNavItems();
      case 'seller':
        return getSellerNavItems();
      case 'admin':
        return getAdminNavItems();
      default:
        return getBuyerNavItems();
    }
  };

  const navItems = getNavItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
      <div className="grid grid-cols-4 h-16 max-w-full overflow-hidden">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                item.active
                  ? 'text-[#1B1828] bg-gray-50'
                  : 'text-gray-500 hover:text-[#1B1828]'
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};