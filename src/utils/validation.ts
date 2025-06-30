// Email validation utility
export const validateEmail = (email: string): { isValid: boolean; message: string } => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  // Additional checks for common issues
  if (email.length > 254) {
    return { isValid: false, message: 'Email address is too long' };
  }

  if (email.includes('..')) {
    return { isValid: false, message: 'Email address cannot contain consecutive dots' };
  }

  // Check for disposable email domains (common ones)
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 
    'mailinator.com', 'throwaway.email', 'temp-mail.org'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { isValid: false, message: 'Please use a permanent email address' };
  }

  return { isValid: true, message: 'Valid email address' };
};

// Password strength validation
export interface PasswordStrength {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  isValid: boolean;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const feedback: string[] = [];
  let score = 0;

  // Check minimum requirements
  if (!requirements.length) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!requirements.uppercase) {
    feedback.push('Add at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!requirements.lowercase) {
    feedback.push('Add at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!requirements.number) {
    feedback.push('Add at least one number');
  } else {
    score += 1;
  }

  if (!requirements.special) {
    feedback.push('Add at least one special character (!@#$%^&*)');
  } else {
    score += 1;
  }

  // Additional strength checks
  if (password.length >= 12) {
    score += 0.5;
  }

  if (password.length >= 16) {
    score += 0.5;
  }

  // Check for common weak patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /111111/,
    /000000/,
  ];

  const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
  if (hasCommonPattern) {
    score -= 1;
    feedback.push('Avoid common patterns like "123456" or "password"');
  }

  // Check for repetitive characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push('Avoid repetitive characters');
  }

  // Normalize score to 0-4 range
  score = Math.max(0, Math.min(4, Math.floor(score)));

  const isValid = score >= 3 && Object.values(requirements).every(req => req);

  if (feedback.length === 0 && isValid) {
    if (score === 4) {
      feedback.push('Very strong password!');
    } else if (score === 3) {
      feedback.push('Strong password');
    }
  }

  return {
    score,
    feedback,
    isValid,
    requirements,
  };
};

// Get password strength label and color
export const getPasswordStrengthInfo = (score: number) => {
  switch (score) {
    case 0:
      return { label: 'Very Weak', color: 'text-red-600', bgColor: 'bg-red-500' };
    case 1:
      return { label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-400' };
    case 2:
      return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    case 3:
      return { label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500' };
    case 4:
      return { label: 'Very Strong', color: 'text-green-700', bgColor: 'bg-green-600' };
    default:
      return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-400' };
  }
};