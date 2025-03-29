'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentSuccess() {
  const [tokenAmount, setTokenAmount] = useState(null);
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    // Try to retrieve the payment reference from localStorage
    const reference = localStorage.getItem('pendingPaystackReference');
    
    // Retrieve user data if available in localStorage
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) setEmail(savedEmail);
    
    const savedTokenAmount = localStorage.getItem('tokenAmount');
    if (savedTokenAmount) setTokenAmount(parseInt(savedTokenAmount, 10));
    
    // Clear the reference from localStorage
    if (reference) {
      console.log('Clearing payment reference from localStorage');
      localStorage.removeItem('pendingPaystackReference');
    }
  }, []);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow">
            <div className="card-body p-5 text-center">
              <div className="mb-4">
                <i className="fa fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
              </div>
              <h2 className="mb-4">Payment Successful!</h2>
              
              {tokenAmount && (
                <p className="lead mb-4">
                  You have successfully purchased {tokenAmount} tokens{email && ` for ${email}`}.
                </p>
              )}
              
              <p>
                A confirmation email has been sent with your purchase details.
                If you don't receive it within a few minutes, please check your spam folder.
              </p>
              
              <div className="mt-4">
                <Link href="/" className="btn btn-primary">
                  Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}