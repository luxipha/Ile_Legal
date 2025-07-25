import { useState, useEffect } from "react";
import { ShieldIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { ActivityService, AdminActivity } from "../../../services/activityService";

export const LoginHistoryCard = () => {
  const [loginActivities, setLoginActivities] = useState<AdminActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadLoginHistory();
  }, []);

  const loadLoginHistory = async () => {
    try {
      setIsLoading(true);
      // Get all activities and filter for login/logout events
      const activities = await ActivityService.getRecentActivities(50);
      const loginEvents = activities.filter(activity => 
        activity.action_type === 'login' || activity.action_type === 'logout'
      );
      setLoginActivities(loginEvents);
    } catch (error) {
      console.error('Error loading login history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadLoginHistory();
    setIsRefreshing(false);
  };

  const getStatusInfo = (activity: AdminActivity) => {
    if (activity.action_type === 'login') {
      return {
        label: 'Successful',
        className: 'bg-green-100 text-green-800'
      };
    } else if (activity.action_type === 'logout') {
      return {
        label: 'Logout',
        className: 'bg-gray-100 text-gray-800'
      };
    }
    return {
      label: 'Unknown',
      className: 'bg-gray-100 text-gray-800'
    };
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShieldIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Login History</h3>
              <p className="text-gray-600">Loading login activities...</p>
            </div>
          </div>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ShieldIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Login History</h3>
              <p className="text-gray-600">Recent login activities on your account</p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {loginActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShieldIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No login history found</p>
            <p className="text-sm mt-1">Your login activities will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loginActivities.map((activity) => {
                  const status = getStatusInfo(activity);
                  return (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(activity.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.ip_address || '127.0.0.1'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.metadata?.location || 'Nigeria'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.metadata?.device_info || 'Unknown Device'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
