import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const PaymentCompletePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'success' | 'error' | 'processing'>('processing');

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const paymentStatus = searchParams.get('redirect_status');

    if (paymentStatus === 'succeeded') {
      setStatus('success');
    } else if (paymentStatus === 'failed') {
      setStatus('error');
    }
  }, [searchParams]);

  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="bg-white shadow-card rounded-lg p-8 text-center">
        {status === 'success' ? (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-success-500" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Payment Successful</h1>
            <p className="mt-2 text-gray-600">
              Your payment has been processed successfully. You can now continue using our services.
            </p>
          </>
        ) : status === 'error' ? (
          <>
            <XCircle className="mx-auto h-16 w-16 text-error-500" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Payment Failed</h1>
            <p className="mt-2 text-gray-600">
              There was an error processing your payment. Please try again or contact support if the problem persists.
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500" />
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Processing Payment</h1>
            <p className="mt-2 text-gray-600">
              Please wait while we confirm your payment...
            </p>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary flex items-center justify-center mx-auto"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCompletePage;