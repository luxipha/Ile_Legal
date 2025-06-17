import { ActivityIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";

export const RecentActionsCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ActivityIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Recent Actions</h3>
            <p className="text-gray-600">Your most recent activities on the platform</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Updated system settings</div>
              <div className="text-sm text-gray-600">Changed email notification preferences</div>
              <div className="text-xs text-gray-500">10 minutes ago</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Reviewed dispute #12345</div>
              <div className="text-sm text-gray-600">Added comments and changed status to "In Progress"</div>
              <div className="text-xs text-gray-500">1 hour ago</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Modified user permissions</div>
              <div className="text-sm text-gray-600">Updated role for user ID: 78901</div>
              <div className="text-xs text-gray-500">3 hours ago</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">System backup</div>
              <div className="text-sm text-gray-600">Initiated manual system backup</div>
              <div className="text-xs text-gray-500">Yesterday at 18:30</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
            <div>
              <div className="font-medium">Security alert acknowledged</div>
              <div className="text-sm text-gray-600">Responded to unusual login attempt</div>
              <div className="text-xs text-gray-500">Yesterday at 10:15</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
