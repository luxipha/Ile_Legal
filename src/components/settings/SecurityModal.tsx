import { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Shield, Key, Lock } from "lucide-react";

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    passwordExpiryDays: number;
  };
  twoFactorAuth: {
    enabled: boolean;
    required: boolean;
    methods: {
      app: boolean;
      sms: boolean;
      email: boolean;
    };
  };
  sessionManagement: {
    sessionTimeoutMinutes: number;
    maxConcurrentSessions: number;
    enforceSignOut: boolean;
  };
}

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: SecuritySettings) => void;
  initialSettings?: SecuritySettings;
}

export const SecurityModal = ({
  isOpen,
  onClose,
  onSave,
  initialSettings = {
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      passwordExpiryDays: 90
    },
    twoFactorAuth: {
      enabled: false,
      required: false,
      methods: {
        app: true,
        sms: true,
        email: true
      }
    },
    sessionManagement: {
      sessionTimeoutMinutes: 30,
      maxConcurrentSessions: 5,
      enforceSignOut: false
    }
  }
}: SecurityModalProps) => {
  const [settings, setSettings] = useState<SecuritySettings>(initialSettings);

  const updatePasswordPolicy = (field: string, value: any) => {
    setSettings({
      ...settings,
      passwordPolicy: {
        ...settings.passwordPolicy,
        [field]: value
      }
    });
  };

  const updateTwoFactorAuth = (field: string, value: any) => {
    setSettings({
      ...settings,
      twoFactorAuth: {
        ...settings.twoFactorAuth,
        [field]: value
      }
    });
  };

  const updateTwoFactorMethod = (method: string, value: boolean) => {
    setSettings({
      ...settings,
      twoFactorAuth: {
        ...settings.twoFactorAuth,
        methods: {
          ...settings.twoFactorAuth.methods,
          [method]: value
        }
      }
    });
  };

  const updateSessionManagement = (field: string, value: any) => {
    setSettings({
      ...settings,
      sessionManagement: {
        ...settings.sessionManagement,
        [field]: value
      }
    });
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Security Settings" size="lg">
      <div className="space-y-6">
        <p className="text-gray-600">
          Configure security settings for your application, including password policies, two-factor authentication, and session management.
        </p>

        {/* Password Policy */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center p-4 bg-gray-50">
            <Key className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-900">Password Policy</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min-length">Minimum Password Length</Label>
                <input
                  id="min-length"
                  type="number"
                  min="6"
                  max="32"
                  value={settings.passwordPolicy.minLength}
                  onChange={(e) => updatePasswordPolicy("minLength", parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="password-expiry">Password Expiry (Days)</Label>
                <input
                  id="password-expiry"
                  type="number"
                  min="0"
                  max="365"
                  value={settings.passwordPolicy.passwordExpiryDays}
                  onChange={(e) => updatePasswordPolicy("passwordExpiryDays", parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Set to 0 for no expiry</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  id="require-uppercase"
                  type="checkbox"
                  checked={settings.passwordPolicy.requireUppercase}
                  onChange={(e) => updatePasswordPolicy("requireUppercase", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="require-uppercase">Require Uppercase</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="require-lowercase"
                  type="checkbox"
                  checked={settings.passwordPolicy.requireLowercase}
                  onChange={(e) => updatePasswordPolicy("requireLowercase", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="require-lowercase">Require Lowercase</Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  id="require-numbers"
                  type="checkbox"
                  checked={settings.passwordPolicy.requireNumbers}
                  onChange={(e) => updatePasswordPolicy("requireNumbers", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="require-numbers">Require Numbers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="require-special"
                  type="checkbox"
                  checked={settings.passwordPolicy.requireSpecialChars}
                  onChange={(e) => updatePasswordPolicy("requireSpecialChars", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="require-special">Require Special Characters</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center p-4 bg-gray-50">
            <Shield className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa-enabled">Enable Two-Factor Authentication</Label>
              <div className="flex items-center">
                <input
                  id="2fa-enabled"
                  type="checkbox"
                  checked={settings.twoFactorAuth.enabled}
                  onChange={(e) => updateTwoFactorAuth("enabled", e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>

            {settings.twoFactorAuth.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <Label htmlFor="2fa-required">Require for All Users</Label>
                  <div className="flex items-center">
                    <input
                      id="2fa-required"
                      type="checkbox"
                      checked={settings.twoFactorAuth.required}
                      onChange={(e) => updateTwoFactorAuth("required", e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="mb-2 block">Authentication Methods</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        id="2fa-app"
                        type="checkbox"
                        checked={settings.twoFactorAuth.methods.app}
                        onChange={(e) => updateTwoFactorMethod("app", e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="2fa-app">Authenticator App</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="2fa-sms"
                        type="checkbox"
                        checked={settings.twoFactorAuth.methods.sms}
                        onChange={(e) => updateTwoFactorMethod("sms", e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="2fa-sms">SMS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="2fa-email"
                        type="checkbox"
                        checked={settings.twoFactorAuth.methods.email}
                        onChange={(e) => updateTwoFactorMethod("email", e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Label htmlFor="2fa-email">Email</Label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Session Management */}
        <div className="border rounded-lg overflow-hidden">
          <div className="flex items-center p-4 bg-gray-50">
            <Lock className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-900">Session Management</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session-timeout">Session Timeout (Minutes)</Label>
                <input
                  id="session-timeout"
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.sessionManagement.sessionTimeoutMinutes}
                  onChange={(e) => updateSessionManagement("sessionTimeoutMinutes", parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="max-sessions">Maximum Concurrent Sessions</Label>
                <input
                  id="max-sessions"
                  type="number"
                  min="1"
                  max="10"
                  value={settings.sessionManagement.maxConcurrentSessions}
                  onChange={(e) => updateSessionManagement("maxConcurrentSessions", parseInt(e.target.value))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="enforce-signout"
                type="checkbox"
                checked={settings.sessionManagement.enforceSignOut}
                onChange={(e) => updateSessionManagement("enforceSignOut", e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="enforce-signout">Enforce Sign Out on Password Change</Label>
            </div>
          </div>
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
