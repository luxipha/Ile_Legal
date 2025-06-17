import { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Check, X, UserCheck, ArrowUp, ArrowDown } from "lucide-react";

interface KYCRequirement {
  id: string;
  name: string;
  description: string;
  required: boolean;
  order: number;
  type: "document" | "information" | "verification";
}

interface KYCSettings {
  enabled: boolean;
  requiredLevel: "basic" | "intermediate" | "advanced";
  requirements: KYCRequirement[];
}

interface KYCRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: KYCSettings) => void;
  initialSettings?: KYCSettings;
}

export const KYCRequirementsModal = ({
  isOpen,
  onClose,
  onSave,
  initialSettings = {
    enabled: false,
    requiredLevel: "basic",
    requirements: [
      {
        id: "1",
        name: "Government ID",
        description: "Valid government-issued photo ID (passport, driver's license, national ID)",
        required: true,
        order: 1,
        type: "document"
      },
      {
        id: "2",
        name: "Proof of Address",
        description: "Utility bill, bank statement, or official letter (not older than 3 months)",
        required: true,
        order: 2,
        type: "document"
      },
      {
        id: "3",
        name: "Facial Verification",
        description: "Selfie with ID document for verification",
        required: true,
        order: 3,
        type: "verification"
      },
      {
        id: "4",
        name: "Phone Number",
        description: "Verified phone number",
        required: true,
        order: 4,
        type: "information"
      },
      {
        id: "5",
        name: "Bank Account Details",
        description: "Bank account information for payments",
        required: false,
        order: 5,
        type: "information"
      }
    ]
  }
}: KYCRequirementsModalProps) => {
  const [settings, setSettings] = useState<KYCSettings>(initialSettings);

  const toggleKYCEnabled = () => {
    setSettings({
      ...settings,
      enabled: !settings.enabled
    });
  };

  const updateRequiredLevel = (level: "basic" | "intermediate" | "advanced") => {
    setSettings({
      ...settings,
      requiredLevel: level
    });
  };

  const toggleRequirementRequired = (id: string) => {
    setSettings({
      ...settings,
      requirements: settings.requirements.map(req =>
        req.id === id ? { ...req, required: !req.required } : req
      )
    });
  };

  const moveRequirement = (id: string, direction: "up" | "down") => {
    const currentIndex = settings.requirements.findIndex(req => req.id === id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === settings.requirements.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newRequirements = [...settings.requirements];
    const item = newRequirements[currentIndex];
    newRequirements.splice(currentIndex, 1);
    newRequirements.splice(newIndex, 0, item);

    // Update order values
    const updatedRequirements = newRequirements.map((req, index) => ({
      ...req,
      order: index + 1
    }));

    setSettings({
      ...settings,
      requirements: updatedRequirements
    });
  };

  const handleSave = () => {
    onSave(settings);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="KYC Requirements" size="lg">
      <div className="space-y-6">
        <p className="text-gray-600">
          Configure Know Your Customer (KYC) requirements for user verification on your platform.
        </p>

        {/* KYC Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <UserCheck className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">KYC Verification</h3>
              <p className="text-sm text-gray-500">Require identity verification for users</p>
            </div>
          </div>
          <Button
            onClick={toggleKYCEnabled}
            variant={settings.enabled ? "default" : "outline"}
            className={settings.enabled ? 
              "bg-green-600 hover:bg-green-700 text-white" : 
              "border-gray-300 text-gray-700"
            }
          >
            {settings.enabled ? "Enabled" : "Disabled"}
          </Button>
        </div>

        {settings.enabled && (
          <>
            {/* Required Level */}
            <div className="space-y-3">
              <Label>Required Verification Level</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={settings.requiredLevel === "basic" ? "default" : "outline"}
                  className={settings.requiredLevel === "basic" ? 
                    "bg-[#1B1828] hover:bg-[#1B1828]/90 text-white" : 
                    "border-gray-300 text-gray-700"
                  }
                  onClick={() => updateRequiredLevel("basic")}
                >
                  Basic
                </Button>
                <Button
                  variant={settings.requiredLevel === "intermediate" ? "default" : "outline"}
                  className={settings.requiredLevel === "intermediate" ? 
                    "bg-[#1B1828] hover:bg-[#1B1828]/90 text-white" : 
                    "border-gray-300 text-gray-700"
                  }
                  onClick={() => updateRequiredLevel("intermediate")}
                >
                  Intermediate
                </Button>
                <Button
                  variant={settings.requiredLevel === "advanced" ? "default" : "outline"}
                  className={settings.requiredLevel === "advanced" ? 
                    "bg-[#1B1828] hover:bg-[#1B1828]/90 text-white" : 
                    "border-gray-300 text-gray-700"
                  }
                  onClick={() => updateRequiredLevel("advanced")}
                >
                  Advanced
                </Button>
              </div>
            </div>

            {/* Requirements List */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Verification Requirements</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {settings.requirements.map((requirement) => (
                      <tr key={requirement.id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{requirement.name}</div>
                            <div className="text-sm text-gray-500">{requirement.description}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            requirement.type === "document" ? "bg-blue-100 text-blue-800" :
                            requirement.type === "verification" ? "bg-purple-100 text-purple-800" :
                            "bg-green-100 text-green-800"
                          }`}>
                            {requirement.type.charAt(0).toUpperCase() + requirement.type.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRequirementRequired(requirement.id)}
                            className={`h-8 w-8 rounded-full ${
                              requirement.required ? "text-green-500" : "text-gray-400"
                            }`}
                          >
                            {requirement.required ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <X className="h-5 w-5" />
                            )}
                          </Button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveRequirement(requirement.id, "up")}
                              disabled={requirement.order === 1}
                              className="h-6 w-6 rounded-full"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-gray-500">{requirement.order}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => moveRequirement(requirement.id, "down")}
                              disabled={requirement.order === settings.requirements.length}
                              className="h-6 w-6 rounded-full"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

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
