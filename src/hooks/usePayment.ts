import { useState } from 'react';
import { usePaymentStore } from '../store/paymentStore';
import { api } from '../services/api';

export const usePayment = () => {
  const { setClientSecret, setIsProcessing, setError } = usePaymentStore();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const initializePayment = async (amount: number) => {
    try {
      setIsProcessing(true);
      setError(null);
      const { clientSecret } = await api.payments.createPaymentIntent(amount);
      setClientSecret(clientSecret);
      return clientSecret;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize payment');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const processPayment = async (paymentIntentId: string) => {
    try {
      setPaymentStatus('processing');
      await api.payments.processPayment(paymentIntentId);
      setPaymentStatus('success');
    } catch (error) {
      setPaymentStatus('error');
      setError(error instanceof Error ? error.message : 'Payment processing failed');
      throw error;
    }
  };

  return {
    initializePayment,
    processPayment,
    paymentStatus,
  };
};