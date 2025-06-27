import { useState, useEffect } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Check, X } from "lucide-react";
import { SettingsService } from "../../services/settingsService";

interface PaymentProvider {
  name: string;
  enabled: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  callbackUrl?: string;
  testMode: boolean;
  escrowWalletId?: string;
}

interface PaymentProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (providers: PaymentProvider[]) => void;
  initialProviders?: PaymentProvider[];
}

export const PaymentProcessingModal = ({
  isOpen,
  onClose,
  onSave,
  initialProviders = [
    { 
      name: "Circle", 
      enabled: false, 
      testMode: true,
      apiKey: "",
      escrowWalletId: ""
    },
    { name: "Flutterwave", enabled: false, testMode: true },
    { name: "Paystack", enabled: false, testMode: true }
  ]
}: PaymentProcessingModalProps) => {
  const [providers, setProviders] = useState<PaymentProvider[]>(initialProviders);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      // Clear cache to ensure fresh data
      SettingsService.clearCache();
      loadCurrentSettings();
    }
  }, [isOpen]);

  const loadCurrentSettings = async () => {
    try {
      setIsLoading(true);
      const settings = await SettingsService.getSettings();
      // Filter out Stripe and PayPal from loaded settings
      const filteredProviders = settings.paymentProviders.filter(
        provider => provider.name !== 'Stripe' && provider.name !== 'PayPal'
      );
      setProviders(filteredProviders);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProvider = (name: string) => {
    setProviders(providers.map(provider => 
      provider.name === name ? { ...provider, enabled: !provider.enabled } : provider
    ));
  };

  const handleToggleTestMode = (name: string) => {
    setProviders(providers.map(provider => 
      provider.name === name ? { ...provider, testMode: !provider.testMode } : provider
    ));
  };

  const handleUpdateProvider = (name: string, field: string, value: string) => {
    setProviders(providers.map(provider => 
      provider.name === name ? { ...provider, [field]: value } : provider
    ));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Filter out Stripe and PayPal before saving
      const filteredProviders = providers.filter(
        provider => provider.name !== 'Stripe' && provider.name !== 'PayPal'
      );
      await SettingsService.updatePaymentProviders(filteredProviders);
      onSave(filteredProviders);
      onClose();
    } catch (error) {
      console.error('Error saving payment providers:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Processing Configuration" size="lg">
      <div className="space-y-6">
        <p className="text-gray-600">
          Configure payment processing providers for your application. Enable or disable providers and set required credentials.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading settings...</div>
          </div>
        ) : (
          <div className="space-y-6">
          {providers.map((provider) => (
            <div key={provider.name} className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    provider.enabled ? "bg-green-100" : "bg-gray-100"
                  }`}>
                    {provider.enabled ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900">{provider.name}</h3>
                </div>
                <Button
                  onClick={() => handleToggleProvider(provider.name)}
                  variant={provider.enabled ? "default" : "outline"}
                  className={provider.enabled ? 
                    "bg-green-600 hover:bg-green-700 text-white" : 
                    "border-gray-300 text-gray-700"
                  }
                >
                  {provider.enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {provider.enabled && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${provider.name}-api-key`}>
                        {provider.name === "Paystack" ? "Public Key" : "API Key"}
                      </Label>
                      <input
                        id={`${provider.name}-api-key`}
                        type="text"
                        value={provider.apiKey || ""}
                        onChange={(e) => handleUpdateProvider(provider.name, "apiKey", e.target.value)}
                        placeholder={provider.name === "Paystack" ? "pk_test_..." : "Enter API key"}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${provider.name}-secret-key`}>Secret Key</Label>
                      <input
                        id={`${provider.name}-secret-key`}
                        type="password"
                        value={provider.secretKey || ""}
                        onChange={(e) => handleUpdateProvider(provider.name, "secretKey", e.target.value)}
                        placeholder={provider.name === "Paystack" ? "sk_test_..." : "Enter secret key"}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {provider.name === "Circle" ? (
                    <div>
                      <Label htmlFor={`${provider.name}-escrow-wallet`}>Escrow Wallet ID</Label>
                      <input
                        id={`${provider.name}-escrow-wallet`}
                        type="text"
                        value={provider.escrowWalletId || ""}
                        onChange={(e) => handleUpdateProvider(provider.name, "escrowWalletId", e.target.value)}
                        placeholder="Enter escrow wallet ID"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${provider.name}-webhook-url`}>
                          Webhook URL
                          <span className="text-xs text-gray-500 block">For payment notifications</span>
                        </Label>
                        <input
                          id={`${provider.name}-webhook-url`}
                          type="text"
                          value={provider.webhookUrl || ""}
                          onChange={(e) => handleUpdateProvider(provider.name, "webhookUrl", e.target.value)}
                          placeholder="https://yourdomain.com/api/paystack/webhook"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      {provider.name === "Paystack" && (
                        <div>
                          <Label htmlFor={`${provider.name}-callback-url`}>
                            Callback URL
                            <span className="text-xs text-gray-500 block">For payment redirects</span>
                          </Label>
                          <input
                            id={`${provider.name}-callback-url`}
                            type="text"
                            value={provider.callbackUrl || ""}
                            onChange={(e) => handleUpdateProvider(provider.name, "callbackUrl", e.target.value)}
                            placeholder="https://yourdomain.com/payment/callback"
                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      id={`${provider.name}-test-mode`}
                      type="checkbox"
                      checked={provider.testMode}
                      onChange={() => handleToggleTestMode(provider.name)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor={`${provider.name}-test-mode`}>Test Mode</Label>
                  </div>
                </div>
              )}
            </div>
          ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
