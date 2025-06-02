import React from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationsContext';
import { format } from 'date-fns';

const NotificationsDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-error-500 ring-2 ring-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-500 hover:text-primary-600"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-200">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`py-4 ${!notification.read ? 'bg-primary-50' : ''}`}
                  >
                    {notification.link ? (
                      <Link
                        to={notification.link}
                        className="block"
                        onClick={() => handleNotificationClick(notification.id, notification.link)}
                      >
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.timestamp), 'MMM d, yyyy HH:mm')}
                          </span>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-800">{notification.message}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {format(new Date(notification.timestamp), 'MMM d, yyyy HH:mm')}
                          </span>
                          <div className="flex space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-primary-500 hover:text-primary-600"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => clearNotification(notification.id)}
                              className="text-gray-400 hover:text-error-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <Bell className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsDropdown;