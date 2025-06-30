import React from 'react';
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon } from 'lucide-react';

interface EmailValidationIndicatorProps {
  email: string;
  isValid: boolean;
  message: string;
  showValidation?: boolean;
}

export const EmailValidationIndicator: React.FC<EmailValidationIndicatorProps> = ({
  email,
  isValid,
  message,
  showValidation = true,
}) => {
  if (!email || !showValidation) return null;

  return (
    <div className="mt-1">
      <div
        className={`flex items-center gap-2 text-sm ${
          isValid ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isValid ? (
          <CheckCircleIcon className="w-4 h-4" />
        ) : (
          <XCircleIcon className="w-4 h-4" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default EmailValidationIndicator;