import { AlertCircleIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";

export const AlertThresholdsCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertCircleIcon className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Alert Thresholds</h3>
            <p className="text-gray-600">Set thresholds for important system alerts</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-900">New Disputes</label>
              <span className="text-sm text-gray-600">10 per day</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              defaultValue="10"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-900">System Load</label>
              <span className="text-sm text-gray-600">75%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="75"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-gray-900">Failed Login Attempts</label>
              <span className="text-sm text-gray-600">3 attempts</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              defaultValue="3"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>3</span>
              <span>5</span>
              <span>7</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
