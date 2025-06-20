import { useState, useEffect } from "react";
import { FileTextIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { ActivityService, AdminActivity } from "../../../services/activityService";

export const SystemAuditLogCard = () => {
  const [auditActivities, setAuditActivities] = useState<AdminActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadAuditLog();
  }, []);

  const loadAuditLog = async () => {
    try {
      setIsLoading(true);
      // Get all activities and filter for system/security events
      const activities = await ActivityService.getRecentActivities(50);
      const auditEvents = activities.filter(activity => 
        ['security', 'role_management', 'user_management', 'system', 'profile_update'].includes(activity.action_type)
      );
      setAuditActivities(auditEvents);
    } catch (error) {
      console.error('Error loading audit log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAuditLog();
    setIsRefreshing(false);
  };

  const getEventTypeInfo = (actionType: string) => {
    switch (actionType) {
      case 'security':
        return {
          label: 'Security',
          className: 'bg-red-100 text-red-800'
        };
      case 'role_management':
        return {
          label: 'Role Management',
          className: 'bg-purple-100 text-purple-800'
        };
      case 'user_management':
        return {
          label: 'User Management',
          className: 'bg-green-100 text-green-800'
        };
      case 'system':
        return {
          label: 'System',
          className: 'bg-blue-100 text-blue-800'
        };
      case 'profile_update':
        return {
          label: 'Profile Update',
          className: 'bg-yellow-100 text-yellow-800'
        };
      default:
        return {
          label: 'Other',
          className: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileTextIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">System Audit Log</h3>
              <p className="text-gray-600">Loading system audit events...</p>
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
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileTextIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">System Audit Log</h3>
              <p className="text-gray-600">Critical system changes and events</p>
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
        
        {auditActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No audit events found</p>
            <p className="text-sm mt-1">System audit events will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditActivities.map((activity) => {
                  const eventType = getEventTypeInfo(activity.action_type);
                  return (
                    <tr key={activity.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(activity.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${eventType.className}`}>
                          {eventType.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {activity.action_description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.metadata?.user_email || 'admin.test@ile-legal.com'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {activity.ip_address || '127.0.0.1'}
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
