import { BellIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Switch } from "../../../components/ui/switch";

export const InAppNotificationsCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">In-App Notifications</h3>
            <p className="text-gray-600">Configure notifications within the application</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Dispute Updates</h4>
              <p className="text-sm text-gray-600">Receive notifications about dispute status changes</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">User Activity</h4>
              <p className="text-sm text-gray-600">Receive notifications about important user activities</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">System Notifications</h4>
              <p className="text-sm text-gray-600">Receive notifications about system events and updates</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
