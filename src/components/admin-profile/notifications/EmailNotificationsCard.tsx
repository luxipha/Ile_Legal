import { MailIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Switch } from "../../../components/ui/switch";

export const EmailNotificationsCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MailIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Email Notifications</h3>
            <p className="text-gray-600">Configure which emails you receive</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">System Updates</h4>
              <p className="text-sm text-gray-600">Receive emails about system updates and maintenance</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Dispute Notifications</h4>
              <p className="text-sm text-gray-600">Receive emails about new disputes and updates</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Security Alerts</h4>
              <p className="text-sm text-gray-600">Receive emails about security incidents and login attempts</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Marketing & Updates</h4>
              <p className="text-sm text-gray-600">Receive emails about new features and platform updates</p>
            </div>
            <Switch />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
