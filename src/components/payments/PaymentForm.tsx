import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Shield, CreditCard } from 'lucide-react';
import { usePayment } from '../../hooks/usePayment';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { processPayment } = usePayment();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw submitError;
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/complete`,
        },
        redirect: 'if_required',
      });

      if (paymentError) {
        throw paymentError;
      }

      if (paymentIntent) {
        await processPayment(paymentIntent.id);
        onSuccess();
      }
    } catch (error: any) {
      onError(error.message || 'An error occurred while processing your payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
        <div className="flex items-center text-success-500">
          <Shield className="h-5 w-5 mr-1" />
          <span className="text-sm">Secure Payment</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Amount to Pay:</span>
            <span className="text-xl font-bold text-gray-900">₦{amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />

        <button
          type="submit"
          disabled={isProcessing || !stripe || !elements}
          className="btn-primary w-full"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Pay ₦{amount.toLocaleString()}
            </div>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Your payment is secured by industry-standard encryption.</p>
      </div>
    </div>
  );
};

export default PaymentForm;