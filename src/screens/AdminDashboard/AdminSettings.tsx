import { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { EnvironmentVariablesModal } from "../../components/settings/EnvironmentVariablesModal";
import { AuthenticationModal } from "../../components/settings/AuthenticationModal";
import { PaymentProcessingModal } from "../../components/settings/PaymentProcessingModal";
import { SecurityModal } from "../../components/settings/SecurityModal";
import { KYCRequirementsModal } from "../../components/settings/KYCRequirementsModal";
import {
  ShieldCheckIcon,
  DollarSignIcon,
  UserCheckIcon
} from "lucide-react";

export const AdminSettings = (): JSX.Element => {
  // Modal visibility state
  const [isEnvVarModalOpen, setIsEnvVarModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Settings</h2>
      
      {/* Environment Variables */}
      <Card className="bg-white border border-gray-200 mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Environment Variables</h3>
              <p className="text-gray-600">Manage application environment variables and API keys</p>
            </div>
            <Button 
              className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]"
              onClick={() => setIsEnvVarModalOpen(true)}
            >
              + Add Variable
            </Button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>PAYSTACK_SECRET_KEY</span>
              <span className="bg-gray-200 px-2 py-1 rounded">••••••••••••••••</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>SMTP_SERVER</span>
              <span>smtp.ile.africa</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>FRONTEND_URL</span>
              <span>https://app.ile.africa</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Integrations</h3>
        <p className="text-gray-600 mb-6">Configure third-party service integrations</p>

        <div className="grid grid-cols-2 gap-6">
          {/* Authentication */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Authentication</h4>
                  <p className="text-sm text-gray-600">Configure authentication providers</p>
                </div>
              </div>
              <Button 
                className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white w-full"
                onClick={() => setIsAuthModalOpen(true)}
              >
                Configure
              </Button>
            </CardContent>
          </Card>

          {/* Payment Processing */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <DollarSignIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Payment Processing</h4>
                  <p className="text-sm text-gray-600">Manage payment gateway settings</p>
                </div>
              </div>
              <Button 
                className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white w-full"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                Configure
              </Button>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Security</h4>
                  <p className="text-sm text-gray-600">Manage security and compliance settings</p>
                </div>
              </div>
              <Button 
                className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white w-full"
                onClick={() => setIsSecurityModalOpen(true)}
              >
                Configure
              </Button>
            </CardContent>
          </Card>

          {/* KYC Requirements */}
          <Card className="bg-white border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <UserCheckIcon className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">KYC Requirements</h4>
                  <p className="text-sm text-gray-600">Configure verification requirements</p>
                </div>
              </div>
              <Button 
                className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white w-full"
                onClick={() => setIsKYCModalOpen(true)}
              >
                Configure
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Settings Modals */}
      <EnvironmentVariablesModal 
        isOpen={isEnvVarModalOpen}
        onClose={() => setIsEnvVarModalOpen(false)}
        onSave={(variables) => {
          console.log("Environment variables saved:", variables);
          setIsEnvVarModalOpen(false);
        }}
      />
      
      <AuthenticationModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSave={(config) => {
          console.log("Authentication config saved:", config);
          setIsAuthModalOpen(false);
        }}
      />
      
      <PaymentProcessingModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSave={(providers) => {
          console.log("Payment providers saved:", providers);
          setIsPaymentModalOpen(false);
        }}
      />
      
      <SecurityModal 
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        onSave={(settings) => {
          console.log("Security settings saved:", settings);
          setIsSecurityModalOpen(false);
        }}
      />
      
      <KYCRequirementsModal 
        isOpen={isKYCModalOpen}
        onClose={() => setIsKYCModalOpen(false)}
        onSave={(settings) => {
          console.log("KYC requirements saved:", settings);
          setIsKYCModalOpen(false);
        }}
      />
    </div>
  );
};
