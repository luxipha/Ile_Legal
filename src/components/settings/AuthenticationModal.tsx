import { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Check, X } from "lucide-react";

interface AuthConfig {
  provider: string;
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  callbackUrl?: string;
  domain?: string;
}

interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AuthConfig[]) => void;
  initialConfig?: AuthConfig[];
}

export const AuthenticationModal = ({
  isOpen,
  onClose,
  onSave,
  initialConfig = [
    { provider: "Google", enabled: false },
    { provider: "Facebook", enabled: false },
    { provider: "Twitter", enabled: false },
    { provider: "Auth0", enabled: false },
    { provider: "Email/Password", enabled: true }
  ]
}: AuthenticationModalProps) => {
  const [config, setConfig] = useState<AuthConfig[]>(initialConfig);

  const handleToggleProvider = (provider: string) => {
    setConfig(config.map(item => 
      item.provider === provider ? { ...item, enabled: !item.enabled } : item
    ));
  };

  const handleUpdateConfig = (provider: string, field: string, value: string) => {
    setConfig(config.map(item => 
      item.provider === provider ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Authentication Configuration" size="lg">
      <div className="space-y-6">
        <p className="text-gray-600">
          Configure authentication providers for your application. Enable or disable providers and set required credentials.
        </p>

        <div className="space-y-6">
          {config.map((item) => (
            <div key={item.provider} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.enabled ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    {item.enabled ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900">{item.provider}</h3>
                </div>
                <Button
                  onClick={() => handleToggleProvider(item.provider)}
                  variant={item.enabled ? "default" : "outline"}
                  className={item.enabled ? 
                    "bg-green-600 hover:bg-green-700 text-white" : 
                    "border-gray-300 text-gray-700"
                  }
                >
                  {item.enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {item.enabled && item.provider !== "Email/Password" && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${item.provider}-client-id`}>Client ID</Label>
                      <input
                        id={`${item.provider}-client-id`}
                        type="text"
                        value={item.clientId || ""}
                        onChange={(e) => handleUpdateConfig(item.provider, "clientId", e.target.value)}
                        placeholder="Enter client ID"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${item.provider}-client-secret`}>Client Secret</Label>
                      <input
                        id={`${item.provider}-client-secret`}
                        type="password"
                        value={item.clientSecret || ""}
                        onChange={(e) => handleUpdateConfig(item.provider, "clientSecret", e.target.value)}
                        placeholder="Enter client secret"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`${item.provider}-callback-url`}>Callback URL</Label>
                    <input
                      id={`${item.provider}-callback-url`}
                      type="text"
                      value={item.callbackUrl || ""}
                      onChange={(e) => handleUpdateConfig(item.provider, "callbackUrl", e.target.value)}
                      placeholder="https://yourdomain.com/auth/callback"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {item.provider === "Auth0" && (
                    <div>
                      <Label htmlFor="auth0-domain">Auth0 Domain</Label>
                      <input
                        id="auth0-domain"
                        type="text"
                        value={item.domain || ""}
                        onChange={(e) => handleUpdateConfig(item.provider, "domain", e.target.value)}
                        placeholder="your-tenant.auth0.com"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {item.enabled && item.provider === "Email/Password" && (
                <div className="p-4">
                  <p className="text-sm text-gray-600">
                    Email/Password authentication is enabled by default. Configure password policies and email templates in the Security settings.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
