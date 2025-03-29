'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function PaymentFailure() {
  useEffect(() => {
    // Clear any payment references from localStorage
    localStorage.removeItem('pendingPaystackReference');
  }, []);

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow">
            <div className="card-body p-5 text-center">
              <div className="mb-4">
                <i className="fa fa-times-circle text-danger" style={{ fontSize: '4rem' }}></i>
              </div>
              <h2 className="mb-4">Payment Failed</h2>
              
              <p className="lead mb-4">
                We couldn't process your payment at this time.
              </p>
              
              <p>
                This could be due to:
              </p>
              <ul className="text-start mb-4">
                <li>Insufficient funds in your account</li>
                <li>Temporary issues with your payment method</li>
                <li>Transaction declined by your bank</li>
                <li>Network connectivity issues</li>
              </ul>
              
              <p>
                No charges have been made to your account. You can try again or contact our support team for assistance.
              </p>
              
              <div className="mt-4 d-flex justify-content-center gap-3">
                <Link href="/" className="btn btn-primary">
                  Return to Homepage
                </Link>
                <Link href="/#buy" className="btn btn-outline-primary">
                  Try Again
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}