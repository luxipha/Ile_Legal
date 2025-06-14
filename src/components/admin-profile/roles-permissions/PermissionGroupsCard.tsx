import { LockIcon, PlusIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

export const PermissionGroupsCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <LockIcon className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Permission Groups</h3>
              <p className="text-gray-600">Manage permission groups for users</p>
            </div>
          </div>
          <Button className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white">
            <PlusIcon className="w-4 h-4 mr-2" />
            Create New Group
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">System Administration</h4>
                <p className="text-sm text-gray-600">Full system access and control</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">User Management</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">System Configuration</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Security Settings</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Audit Logs</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Role Management</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">+ 10 more</span>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">Dispute Resolution</h4>
                <p className="text-sm text-gray-600">Access to dispute management features</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">View Disputes</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Update Status</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Add Comments</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Assign Disputes</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Generate Reports</span>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900">User Support</h4>
                <p className="text-sm text-gray-600">Access to user support features</p>
              </div>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">View User Profiles</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Reset Passwords</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Update User Info</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Support Tickets</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
