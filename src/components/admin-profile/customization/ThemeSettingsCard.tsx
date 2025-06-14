import { PaletteIcon } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import { Label } from "../../../components/ui/label";

export const ThemeSettingsCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <PaletteIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Theme Settings</h3>
            <p className="text-gray-600">Customize the appearance of your dashboard</p>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Theme Mode</h4>
            <RadioGroup defaultValue="light" className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="cursor-pointer">Light Mode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="cursor-pointer">Dark Mode</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" />
                <Label htmlFor="system" className="cursor-pointer">System Default</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h4 className="font-medium text-gray-900 mb-4">Color Accent</h4>
            <div className="flex flex-wrap gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full ring-2 ring-offset-2 ring-blue-500 cursor-pointer"></div>
              <div className="w-8 h-8 bg-purple-500 rounded-full ring-offset-2 cursor-pointer"></div>
              <div className="w-8 h-8 bg-green-500 rounded-full ring-offset-2 cursor-pointer"></div>
              <div className="w-8 h-8 bg-red-500 rounded-full ring-offset-2 cursor-pointer"></div>
              <div className="w-8 h-8 bg-yellow-500 rounded-full ring-offset-2 cursor-pointer"></div>
              <div className="w-8 h-8 bg-gray-800 rounded-full ring-offset-2 cursor-pointer"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
