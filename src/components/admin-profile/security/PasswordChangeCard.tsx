import { KeyIcon, EyeIcon, EyeOffIcon, CheckIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

export const PasswordChangeCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <KeyIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Change Password</h3>
              <p className="text-gray-600">Update your password regularly for better security</p>
            </div>
          </div>
          <Button className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white">
            <CheckIcon className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input 
                type="password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter current password"
              />
              <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <EyeIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input 
                type="password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Enter new password"
              />
              <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <EyeOffIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <div className="relative">
              <input 
                type="password" 
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                placeholder="Confirm new password"
              />
              <button className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <EyeOffIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
