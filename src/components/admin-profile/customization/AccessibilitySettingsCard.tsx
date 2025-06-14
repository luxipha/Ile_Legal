import { AccessibilityIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Switch } from "../../../components/ui/switch";

export const AccessibilitySettingsCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <AccessibilityIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Accessibility Settings</h3>
            <p className="text-gray-600">Customize accessibility features</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Larger Text</h4>
              <p className="text-sm text-gray-600">Increase text size throughout the application</p>
            </div>
            <Switch />
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">High Contrast</h4>
              <p className="text-sm text-gray-600">Enhance visual contrast for better readability</p>
            </div>
            <Switch />
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Reduce Motion</h4>
              <p className="text-sm text-gray-600">Minimize animations and transitions</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="border-t border-gray-200"></div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="font-medium text-gray-900">Screen Reader Optimization</h4>
              <p className="text-sm text-gray-600">Optimize for screen reader compatibility</p>
            </div>
            <Switch />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
