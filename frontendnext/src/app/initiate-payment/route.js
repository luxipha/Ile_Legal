import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, tokenAmount, currency } = await request.json();
    
    // Validate input
    if (!email || !tokenAmount) {
      return NextResponse.json(
        { success: false, message: 'Email and token amount are required' },
        { status: 400 }
      );
    }

    console.log(`Initiating payment for ${email}, ${tokenAmount} tokens`);
    
    // Call your backend API to initialize payment
    const response = await fetch('http://localhost:3000/buy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tokenAmount: parseInt(tokenAmount, 10),
        currency: currency || 'NGN',
      }),
    });
    
    const data = await response.json();
    
    // Return the response from your backend
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error initializing payment:', error);
    return NextResponse.json(
      { success: false, message: 'Payment initialization failed: ' + error.message },
      { status: 500 }
    );
  }
}