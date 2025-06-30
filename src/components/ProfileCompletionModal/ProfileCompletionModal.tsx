import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { X, UserIcon, BriefcaseIcon } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (profileData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    userType?: 'client' | 'professional';
    agreeToTerms?: boolean;
  }) => Promise<void>;
  walletAddress?: string;
  authMethod?: 'metamask' | 'google';
  requireRoleSelection?: boolean;
  requireTermsAcceptance?: boolean;
  showWalletInfo?: boolean;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  walletAddress,
  authMethod = 'metamask',
  requireRoleSelection = false,
  requireTermsAcceptance = false,
  showWalletInfo = true
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'client' | 'professional'>('client');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (requireTermsAcceptance && !agreeToTerms) {
      setError('Please agree to the Terms of Service to continue');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        userType: requireRoleSelection ? userType : undefined,
        agreeToTerms: requireTermsAcceptance ? agreeToTerms : undefined
      });
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile completion error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
        </div>

        {showWalletInfo && walletAddress && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✅ {authMethod === 'google' ? 'Google Account' : 'Wallet'} Connected Successfully
            </p>
            {authMethod === 'metamask' && (
              <p className="text-xs text-green-600 font-mono mt-1 break-all">
                {walletAddress}
              </p>
            )}
          </div>
        )}

        <p className="text-gray-600 text-sm mb-6">
          Please provide your details to complete your profile. This will be used for notifications and display purposes.
        </p>

        {/* Role Selection */}
        {requireRoleSelection && (
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Account Type *
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUserType("client")}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  userType === "client"
                    ? "border-[#FEC85F] bg-[#FEC85F] text-[#1B1828]"
                    : "border-gray-300 hover:border-gray-400 bg-white"
                }`}
              >
                <UserIcon className={`w-6 h-6 mx-auto mb-2 ${userType === "client" ? "text-[#1B1828]" : "text-gray-400"}`} />
                <div className="font-semibold text-sm">Client</div>
              </button>
              <button
                type="button"
                onClick={() => setUserType("professional")}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  userType === "professional"
                    ? "border-[#1B1828] bg-[#1B1828] text-white"
                    : "border-gray-300 hover:border-gray-400 bg-white"
                }`}
              >
                <BriefcaseIcon className={`w-6 h-6 mx-auto mb-2 ${userType === "professional" ? "text-[#FEC85F]" : "text-gray-400"}`} />
                <div className="font-semibold text-sm">Legal Professional</div>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="John"
                disabled={isSubmitting}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Doe"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="john.doe@example.com"
              disabled={isSubmitting}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used for notifications and dispute communications
            </p>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />
          </div>

          {/* Terms and Conditions */}
          {requireTermsAcceptance && (
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="agreeToTerms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 text-[#1B1828] focus:ring-[#1B1828] border-gray-300 rounded"
                disabled={isSubmitting}
                required
              />
              <Label htmlFor="agreeToTerms" className="text-sm text-gray-700 leading-5">
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1B1828] hover:text-[#FEC85F] underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1B1828] hover:text-[#FEC85F] underline"
                >
                  Privacy Policy
                </a>
              </Label>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
            >
              {isSubmitting ? 'Saving...' : 'Complete Profile'}
            </Button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          You can update this information later in your profile settings
        </p>
      </div>
    </div>
  );
};