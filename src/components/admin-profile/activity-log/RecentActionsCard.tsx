import { useState, useEffect } from "react";
import { ActivityIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { ActivityService, AdminActivity } from "../../../services/activityService";

export const RecentActionsCard = () => {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setIsLoading(true);
      const data = await ActivityService.getRecentActivities(8);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadActivities();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-lg">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ActivityIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Recent Actions</h3>
              <p className="text-gray-600">Loading your recent activities...</p>
            </div>
          </div>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
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
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ActivityIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Recent Actions</h3>
              <p className="text-gray-600">Your most recent activities on the platform</p>
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
        
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ActivityIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No activities found</p>
            <p className="text-sm mt-1">Your activities will appear here as you use the platform</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${ActivityService.getActivityColor(activity.action_type)}`}></div>
                <div>
                  <div className="font-medium">{ActivityService.formatActivityDescription(activity)}</div>
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="text-sm text-gray-600">
                      {activity.action_type === 'role_management' && activity.metadata.user_email && (
                        `User: ${activity.metadata.user_email}`
                      )}
                      {activity.action_type === 'profile_update' && activity.metadata.fields && (
                        `Fields: ${activity.metadata.fields.join(', ')}`
                      )}
                      {activity.action_type === 'login' && activity.metadata.session_duration && (
                        `Session: ${activity.metadata.session_duration}`
                      )}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {ActivityService.getRelativeTime(activity.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
