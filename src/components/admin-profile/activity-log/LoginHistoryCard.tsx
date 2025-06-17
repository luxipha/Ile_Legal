import { ShieldIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";

export const LoginHistoryCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <ShieldIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Login History</h3>
            <p className="text-gray-600">Recent login activities on your account</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Today, 10:30 AM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Lagos, Nigeria</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Chrome on MacOS</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Successful
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Yesterday, 6:45 PM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">192.168.1.1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Lagos, Nigeria</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Safari on iOS</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Successful
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Jun 10, 2025, 9:15 AM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">203.0.113.1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Abuja, Nigeria</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Firefox on Windows</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Successful
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Jun 9, 2025, 2:30 PM</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">198.51.100.1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Unknown Location</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Unknown Device</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Failed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
