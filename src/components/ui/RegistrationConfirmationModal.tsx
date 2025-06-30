import React from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { XIcon, UserIcon, BriefcaseIcon, CheckCircleIcon, AlertTriangleIcon } from 'lucide-react';

interface RegistrationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userType: 'client' | 'professional';
  agreeToTerms: boolean;
  authMethod: 'google' | 'metamask';
  loading?: boolean;
}

export const RegistrationConfirmationModal: React.FC<RegistrationConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userType,
  agreeToTerms,
  authMethod,
  loading = false,
}) => {
  if (!isOpen) return null;

  const isValid = agreeToTerms;
  const authMethodLabel = authMethod === 'google' ? 'Google' : 'MetaMask';
  const roleLabel = userType === 'professional' ? 'Legal Professional' : 'Client';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="bg-white max-w-md w-full mx-auto">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Confirm Registration
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Registration Summary */}
          <div className="space-y-4 mb-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                You're about to register with {authMethodLabel} as:
              </p>
              
              {/* Account Type Display */}
              <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                {userType === 'professional' ? (
                  <BriefcaseIcon className="w-6 h-6 text-[#1B1828]" />
                ) : (
                  <UserIcon className="w-6 h-6 text-[#FEC85F]" />
                )}
                <span className="font-semibold text-lg text-gray-900">
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Registration Requirements:</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    Account type selected: {roleLabel}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {agreeToTerms ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`text-sm ${agreeToTerms ? 'text-gray-700' : 'text-red-600'}`}>
                    Terms and conditions accepted
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    {authMethodLabel} authentication ready
                  </span>
                </div>
              </div>
            </div>

            {/* Warning if requirements not met */}
            {!isValid && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangleIcon className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium text-red-800">
                    Please accept the terms and conditions to continue
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={!isValid || loading}
              className="flex-1 bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
            >
              {loading ? 'Connecting...' : `Continue with ${authMethodLabel}`}
            </Button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy.
              You can change your account type later in your profile settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationConfirmationModal;