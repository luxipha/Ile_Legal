import { FileTextIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";

export const SystemAuditLogCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <FileTextIcon className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">System Audit Log</h3>
            <p className="text-gray-600">Critical system changes and events</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Jun 13, 2025, 10:30 AM</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Config Change
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">Updated system security settings</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">admin@example.com</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.1</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Jun 12, 2025, 2:15 PM</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    User Management
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">Added new administrator account</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">admin@example.com</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.1</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Jun 11, 2025, 9:45 AM</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    Backup
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">System backup completed successfully</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">system</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">internal</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Jun 10, 2025, 4:30 PM</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Security
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">Failed login attempts threshold reached</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">system</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">198.51.100.1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
