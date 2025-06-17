import { ShieldIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";

export const CurrentRoleCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ShieldIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Current Role</h3>
            <p className="text-gray-600">Your current role and permissions</p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              System Administrator
            </span>
            <span className="text-sm text-gray-600">Highest level access</span>
          </div>
          <p className="text-sm text-gray-700">
            This role provides complete access to all system functions, settings, and data. System Administrators are responsible for managing the entire platform.
          </p>
        </div>
        
        <h4 className="font-medium text-gray-900 mb-4">Permission Details</h4>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">User Management: Create, modify, and delete user accounts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">System Configuration: Modify all system settings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Dispute Resolution: Full access to all dispute cases</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Reports: Generate and view all system reports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Security: Manage security settings and audit logs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Role Management: Create and assign user roles</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
