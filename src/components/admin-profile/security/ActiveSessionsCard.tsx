import { LockIcon, SmartphoneIcon, LogOutIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

export const ActiveSessionsCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Active Sessions</h3>
              <p className="text-gray-600">Manage your active sessions across devices</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <LockIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Current Session</div>
                <div className="text-sm text-gray-600">MacOS • Chrome • Lagos, Nigeria</div>
                <div className="text-xs text-gray-500">Started 2 hours ago</div>
              </div>
            </div>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
              Current
            </span>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <SmartphoneIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-medium">Mobile App</div>
                <div className="text-sm text-gray-600">iOS • Ile App • Lagos, Nigeria</div>
                <div className="text-xs text-gray-500">Last active 1 day ago</div>
              </div>
            </div>
            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
              <LogOutIcon className="w-4 h-4 mr-1" />
              Terminate
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <LockIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-medium">Web Session</div>
                <div className="text-sm text-gray-600">Windows • Firefox • Abuja, Nigeria</div>
                <div className="text-xs text-gray-500">Last active 3 days ago</div>
              </div>
            </div>
            <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
              <LogOutIcon className="w-4 h-4 mr-1" />
              Terminate
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
