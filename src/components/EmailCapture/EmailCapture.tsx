import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface EmailCaptureProps {
  variant?: 'waitlist' | 'newsletter' | 'updates';
  title?: string;
  subtitle?: string;
  placeholder?: string;
  className?: string;
  onSubmit?: (email: string) => Promise<void>;
}

export const EmailCapture: React.FC<EmailCaptureProps> = ({
  variant = 'waitlist',
  title,
  subtitle,
  placeholder,
  className = '',
  onSubmit
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const defaultTexts = {
    waitlist: {
      title: 'Join the Waitlist',
      subtitle: 'Be the first to access new legal services and features',
      placeholder: 'Enter your email address',
      buttonText: 'Join Waitlist',
      successMessage: 'Welcome to the waitlist! We\'ll notify you of updates.'
    },
    newsletter: {
      title: 'Stay Updated',
      subtitle: 'Get weekly legal tips and property law insights',
      placeholder: 'Your email address',
      buttonText: 'Subscribe',
      successMessage: 'Successfully subscribed to our newsletter!'
    },
    updates: {
      title: 'Get Legal Updates',
      subtitle: 'Receive important updates about property law in Nigeria',
      placeholder: 'Enter your email',
      buttonText: 'Get Updates',
      successMessage: 'You\'ll now receive legal updates!'
    }
  };

  const config = defaultTexts[variant];
  const displayTitle = title || config.title;
  const displaySubtitle = subtitle || config.subtitle;
  const displayPlaceholder = placeholder || config.placeholder;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      setStatus('error');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      if (onSubmit) {
        await onSubmit(email);
      } else {
        // Default implementation - store locally or send to API
        await storeEmailCapture(email, variant);
      }
      
      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Email capture error:', error);
      setErrorMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const storeEmailCapture = async (email: string, type: string): Promise<void> => {
    // Store in localStorage for now (in production, this would go to your API)
    const captures = JSON.parse(localStorage.getItem('email_captures') || '[]');
    const newCapture = {
      email,
      type,
      timestamp: new Date().toISOString(),
      source: window.location.pathname
    };
    
    captures.push(newCapture);
    localStorage.setItem('email_captures', JSON.stringify(captures));
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  if (status === 'success') {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 text-center ${className}`}>
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">Thank You!</h3>
        <p className="text-green-700">{config.successMessage}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-3 text-green-700 hover:text-green-800"
          onClick={() => setStatus('idle')}
        >
          Submit Another Email
        </Button>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
      <div className="text-center mb-6">
        <Mail className="w-10 h-10 text-[#1B1828] mx-auto mb-3" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">{displayTitle}</h3>
        <p className="text-gray-600">{displaySubtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') {
                setStatus('idle');
                setErrorMessage('');
              }
            }}
            placeholder={displayPlaceholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B1828] focus:border-transparent"
            disabled={status === 'loading'}
          />
          
          {status === 'error' && (
            <div className="flex items-center gap-2 mt-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{errorMessage}</span>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full py-3 bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]"
          disabled={status === 'loading' || !email.trim()}
        >
          {status === 'loading' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            config.buttonText
          )}
        </Button>
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        We respect your privacy. No spam, unsubscribe at any time.
      </p>
    </div>
  );
};

// Analytics wrapper for email capture
export const trackEmailCapture = (email: string, variant: string, source: string) => {
  // Google Analytics event tracking (when GA is implemented)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'email_capture', {
      event_category: 'engagement',
      event_label: variant,
      custom_parameter_1: source
    });
  }

  // Facebook Pixel event (if implemented)
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'Lead', {
      content_category: variant,
      content_name: source
    });
  }
};