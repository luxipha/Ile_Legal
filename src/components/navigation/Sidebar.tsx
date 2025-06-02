import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Link, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, Briefcase, FileCheck, MessageSquare, CreditCard, UserCheck, Flag, Settings, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../utils/cn';

type SidebarProps = {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Define navigation based on user role
  const getBuyerNavigation = () => [
    { name: 'Dashboard', href: '/buyer/dashboard', icon: LayoutDashboard },
    { name: 'Post a Gig', href: '/buyer/post-gig', icon: Briefcase },
    { name: 'My Gigs', href: '/buyer/my-gigs', icon: FileCheck },
    { name: 'Messages', href: '/buyer/messages', icon: MessageSquare },
    { name: 'Payments', href: '/buyer/payments', icon: CreditCard },
    { name: 'Profile', href: '/buyer/profile', icon: UserCheck },
  ];

  const getSellerNavigation = () => [
    { name: 'Dashboard', href: '/seller/dashboard', icon: LayoutDashboard },
    { name: 'Find Gigs', href: '/seller/find-gigs', icon: Briefcase },
    { name: 'Active Bids', href: '/seller/active-bids', icon: FileCheck },
    { name: 'Messages', href: '/seller/messages', icon: MessageSquare },
    { name: 'Earnings', href: '/seller/earnings', icon: CreditCard },
    { name: 'Profile', href: '/seller/profile', icon: UserCheck },
  ];

  const getAdminNavigation = () => [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Verify Users', href: '/admin/verify-users', icon: UserCheck },
    { name: 'Manage Gigs', href: '/admin/manage-gigs', icon: Briefcase },
    { name: 'Disputes', href: '/admin/disputes', icon: Flag },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Profile', href: '/admin/profile', icon: User },
  ];

  const getNavigation = () => {
    switch(user?.role) {
      case 'buyer': return getBuyerNavigation();
      case 'seller': return getSellerNavigation();
      case 'admin': return getAdminNavigation();
      default: return [];
    }
  };

  const navigation = getNavigation();

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="fixed inset-0 flex z-40 md:hidden" onClose={setSidebarOpen}>
          {/* Dialog overlay */}
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-primary-500">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <img 
                    src="https://www.ile.africa/images/logo.png" 
                    alt="Ilé Legal" 
                    className="h-8 w-auto"
                  />
                </div>
                <nav className="mt-8 space-y-1 px-2">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        location.pathname === item.href
                          ? 'bg-primary-600 text-white'
                          : 'text-white hover:bg-primary-600',
                        'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-4 h-6 w-6 text-primary-100" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex p-4 border-t border-primary-700">
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-full bg-primary-700 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-primary-200 group-hover:text-primary-100">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Transition.Child>
          <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-primary-500">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img 
                src="https://www.ile.africa/images/logo.png" 
                alt="Ilé Legal" 
                className="h-8 w-auto"
              />
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    location.pathname === item.href
                      ? 'bg-primary-600 text-white'
                      : 'text-white hover:bg-primary-600',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5 text-primary-100" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex p-4 border-t border-primary-700">
            <Link to={`/${user?.role}/profile`} className="flex items-center group w-full">
              <div className="h-9 w-9 rounded-full bg-primary-700 flex items-center justify-center">
                <User className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-primary-200 group-hover:text-primary-100">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;