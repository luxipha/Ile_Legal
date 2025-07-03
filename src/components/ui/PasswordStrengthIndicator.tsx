import React from 'react';
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon } from 'lucide-react';
import { PasswordStrength, getPasswordStrengthInfo } from '../../utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
  strength: PasswordStrength;
  showRequirements?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  strength,
  showRequirements = true,
}) => {
  const { label, color, bgColor } = getPasswordStrengthInfo(strength.score);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={`text-sm font-medium ${color}`}>{label}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${bgColor}`}
            style={{ width: `${(strength.score / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Password Requirements</h4>
          <div className="grid grid-cols-1 gap-1 text-sm">
            <RequirementItem
              met={strength.requirements.length}
              text="At least 8 characters"
            />
            <RequirementItem
              met={strength.requirements.uppercase}
              text="One uppercase letter"
            />
            <RequirementItem
              met={strength.requirements.lowercase}
              text="One lowercase letter"
            />
            <RequirementItem
              met={strength.requirements.number}
              text="One number"
            />
            <RequirementItem
              met={strength.requirements.special}
              text="One special character (!@#$%^&*)"
            />
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((message, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 text-sm ${
                strength.isValid && strength.score >= 3
                  ? 'text-green-600'
                  : strength.score >= 2
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {strength.isValid && strength.score >= 3 ? (
                <CheckCircleIcon className="w-4 h-4" />
              ) : strength.score >= 2 ? (
                <AlertCircleIcon className="w-4 h-4" />
              ) : (
                <XCircleIcon className="w-4 h-4" />
              )}
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface RequirementItemProps {
  met: boolean;
  text: string;
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => (
  <div className={`flex items-center gap-2 ${met ? 'text-green-600' : 'text-gray-500'}`}>
    {met ? (
      <CheckCircleIcon className="w-4 h-4" />
    ) : (
      <XCircleIcon className="w-4 h-4" />
    )}
    <span className={met ? 'line-through' : ''}>{text}</span>
  </div>
);

export default PasswordStrengthIndicator;