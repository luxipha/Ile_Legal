import { PhoneIcon, MapPinIcon, MailIcon, ShieldIcon, KeyIcon, ClockIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";

export const ProfileInfoTab = () => {
  return (
    <div className="space-y-6">
      {/* Admin Contact Information */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MailIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">admin@example.com</span>
              </div>
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">+234 123 456 7890</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Lagos, Nigeria</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ShieldIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">System Administrator</span>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">Active since 2022</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Admin Access Details */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Access Details</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Clearance Level</p>
                <p className="text-gray-900 flex items-center gap-1">
                  <KeyIcon className="w-4 h-4 text-blue-600" />
                  Level 5 (Highest)
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-gray-900">System Manager</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Access Scope</p>
                <p className="text-gray-900">Full Platform Access</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Two-Factor Authentication</p>
                <p className="text-gray-900 flex items-center">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></span>
                  Enabled
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Admin Responsibilities */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Responsibilities</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
              <p className="text-gray-700">User verification and management</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
              <p className="text-gray-700">Dispute resolution and oversight</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
              <p className="text-gray-700">Platform analytics monitoring</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
              <p className="text-gray-700">System security maintenance</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-blue-500"></div>
              <p className="text-gray-700">Administrative policy enforcement</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
