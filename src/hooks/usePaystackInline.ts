import { useCallback } from 'react';

// Extend Window interface to include PaystackPop
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: PaystackInlineOptions) => {
        openIframe: () => void;
      };
    };
  }
}

export interface PaystackInlineOptions {
  key: string;
  email: string;
  amount: number; // Amount in kobo
  currency: string;
  ref: string;
  metadata?: any;
  channels?: string[];
  onSuccess: (transaction: any) => void;
  onCancel: () => void;
  onClose: () => void;
}

export const usePaystackInline = () => {
  const initializePayment = useCallback((options: PaystackInlineOptions) => {
    if (typeof window !== 'undefined' && window.PaystackPop) {
      const handler = window.PaystackPop.setup(options);
      handler.openIframe();
    } else {
      console.error('Paystack Inline script not loaded');
      throw new Error('Paystack payment system not available. Please refresh the page.');
    }
  }, []);

  return {
    initializePayment
  };
};