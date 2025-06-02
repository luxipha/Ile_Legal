import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CreditCard, DollarSign, Clock, CheckCircle } from 'lucide-react';
import PaymentForm from '../../components/payments/PaymentForm';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../lib/stripe';

// Mock payment data
const MOCK_PAYMENTS = [
  {
    id: 'p1',
    amount: 65000,
    status: 'pending',
    description: 'Payment for Land Title Verification - Victoria Island Property',
    date: '2025-04-26',
    recipient: 'Chioma Okonkwo',
    transactionId: 'TRX-123456',
  },
  {
    id: 'p2',
    amount: 45000,
    status: 'completed',
    description: 'Payment for Contract Review Services',
    date: '2025-04-20',
    recipient: 'Emmanuel Adegoke',
    transactionId: 'TRX-123457',
  },
];

const PaymentPage: React.FC = () => {
  const { paymentId } = useParams();
  const { user } = useAuth();
  const isBuyer = user?.role === 'buyer';
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Fetch client secret when showing payment form
  useEffect(() => {
    if (showPaymentForm) {
      const fetchClientSecret = async () => {
        try {
          const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 65000 })
          });
          const data = await response.json();
          setClientSecret(data.clientSecret);
        } catch (error) {
          console.error('Error fetching client secret:', error);
          // Show error message to user
          alert('Unable to initialize payment. Please try again later.');
          setShowPaymentForm(false);
        }
      };

      fetchClientSecret();
    }
  }, [showPaymentForm]);

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setClientSecret(null);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    setClientSecret(null);
  };

  // If showing payment form
  if (showPaymentForm) {
    if (!clientSecret) {
      return (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Make Payment</h1>
          <div className="bg-white shadow-card rounded-lg p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="ml-2">Initializing payment...</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Make Payment</h1>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm
            amount={65000}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>
      </div>
    );
  }

  // If viewing a specific payment
  if (paymentId) {
    const payment = MOCK_PAYMENTS.find(p => p.id === paymentId);
    
    if (!payment) {
      return (
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Payment Details</h1>
          <div className="bg-white shadow-card rounded-lg p-6">
            <p className="text-gray-500 text-center">Payment not found</p>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Payment Details</h1>
        <div className="bg-white shadow-card rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="text-lg font-medium">{payment.transactionId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-primary-500">₦{payment.amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-3">Payment Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1 flex items-center">
                    {payment.status === 'completed' ? (
                      <span className="badge-success flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completed
                      </span>
                    ) : (
                      <span className="badge-warning flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="mt-1">{new Date(payment.date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-800 mb-3">Payment Details</h2>
              <p className="text-gray-600">{payment.description}</p>
              <p className="mt-2 text-sm text-gray-500">
                {isBuyer ? 'Paid to' : 'Received from'}: {payment.recipient}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment list view
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
        {isBuyer && (
          <button 
            className="btn-primary flex items-center"
            onClick={() => setShowPaymentForm(true)}
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Make Payment
          </button>
        )}
      </div>

      <div className="bg-white shadow-card rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {MOCK_PAYMENTS.map((payment) => (
            <div key={payment.id} className="p-6 hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-gray-800">{payment.description}</p>
                  <div className="mt-1 flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {new Date(payment.date).toLocaleDateString()}
                    </span>
                    {payment.status === 'completed' ? (
                      <span className="badge-success flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </span>
                    ) : (
                      <span className="badge-warning flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  <div className="flex items-center justify-end">
                    <DollarSign className="h-5 w-5 text-primary-500" />
                    <span className="text-xl font-bold text-primary-500">
                      ₦{payment.amount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 text-right mt-1">
                    {isBuyer ? 'Paid to' : 'Received from'}: {payment.recipient}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;