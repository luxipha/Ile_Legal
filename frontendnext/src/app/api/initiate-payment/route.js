// /src/app/api/initiate-payment/route.js
export async function POST(request) {
    try {
      const body = await request.json();
      
      // Use local backend URL - this is the correct endpoint
      const response = await fetch('http://localhost:3000/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      return Response.json(data);
    } catch (error) {
      console.error('Error proxying payment initiation request:', error);
      return Response.json({ 
        success: false, 
        message: 'Failed to initiate payment' 
      }, { status: 500 });
    }
  }