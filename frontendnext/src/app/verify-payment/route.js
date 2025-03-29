import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { reference } = await request.json();
    
    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Payment reference is required' },
        { status: 400 }
      );
    }

    console.log(`Verifying payment with reference: ${reference}`);
    
    // Call your backend API to verify payment
    const response = await fetch('http://localhost:3000/buy/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Backend verification failed:', data);
      return NextResponse.json(
        { success: false, message: data.message || 'Payment verification failed' },
        { status: response.status }
      );
    }
    
    // Return the response from your backend
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, message: 'Payment verification failed: ' + error.message },
      { status: 500 }
    );
  }
}