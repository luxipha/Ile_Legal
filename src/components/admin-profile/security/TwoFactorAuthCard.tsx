import { SmartphoneIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

export const TwoFactorAuthCard = () => {
  return (
    <Card className="bg-white border border-gray-200 shadow-lg">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <SmartphoneIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h3>
              <p className="text-gray-600">Add an extra layer of security to your account</p>
            </div>
          </div>
          <div className="flex items-center">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-3">
              Enabled
            </span>
            <Button className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white">
              Configure
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">SMS verification enabled</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <CheckIcon className="w-5 h-5 text-green-500" />
            <span className="text-gray-700">Authenticator app configured</span>
          </div>
          <div className="flex items-center gap-3">
            <XIcon className="w-5 h-5 text-gray-400" />
            <span className="text-gray-500">Backup codes not generated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
