'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaystackCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing your payment...');
  const [isVerifying, setIsVerifying] = useState(true);
  
  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    
    if (!reference) {
      setStatus('No payment reference found.');
      setIsVerifying(false);
      setTimeout(() => router.push('/'), 3000);
      return;
    }
    
    // Store the reference in localStorage for potential use later
    localStorage.setItem('pendingPaystackReference', reference);
    
    // Log the reference for debugging (no sensitive data)
    console.log('Processing payment verification');
    
    // Call our API to verify the payment
    verifyPayment(reference);
    
    // Safety net: ensure user is redirected after 15 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      console.log('Safety timeout triggered, redirecting to homepage');
      router.push('/');
    }, 15000);
    
    return () => clearTimeout(safetyTimeout);
  }, [searchParams, router]);
  
  const verifyPayment = async (reference) => {
    try {
      setStatus('Verifying your payment...');
      
      const response = await fetch('/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference }),
      });
      
      if (!response.ok) {
        throw new Error(`Verification failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStatus('Payment successful! Redirecting to homepage...');
        setTimeout(() => router.push('/'), 2000);
      } else {
        setStatus(`Payment verification failed. Redirecting to homepage...`);
        setTimeout(() => router.push('/'), 3000);
      }
    } catch (error) {
      console.error('Error during payment verification');
      setStatus('Error processing payment. Redirecting to homepage...');
      setTimeout(() => router.push('/'), 3000);
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow">
            <div className="card-body p-5 text-center">
              {isVerifying && (
                <div className="mb-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              <h3 className="mb-4">{status}</h3>
              <p className="text-muted">
                You will be redirected automatically. If not, click the button below.
              </p>
              <button 
                className="btn btn-primary mt-3" 
                onClick={() => router.push('/')}
              >
                Return to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}