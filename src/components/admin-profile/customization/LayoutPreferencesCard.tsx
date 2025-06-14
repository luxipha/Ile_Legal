import { LayoutIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { Label } from "../../../components/ui/label";

export const LayoutPreferencesCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <LayoutIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Layout Preferences</h3>
            <p className="text-gray-600">Customize the layout of your dashboard</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Default View</h4>
            <RadioGroup defaultValue="dashboard" className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dashboard" id="dashboard" />
                <Label htmlFor="dashboard" className="cursor-pointer">Dashboard Overview</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="disputes" id="disputes" />
                <Label htmlFor="disputes" className="cursor-pointer">Disputes Management</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="users" id="users" />
                <Label htmlFor="users" className="cursor-pointer">User Management</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Sidebar Position</h4>
            <RadioGroup defaultValue="left" className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="left" id="left" />
                <Label htmlFor="left" className="cursor-pointer">Left Side</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="right" id="right" />
                <Label htmlFor="right" className="cursor-pointer">Right Side</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
