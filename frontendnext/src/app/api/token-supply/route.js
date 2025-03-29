// /src/app/api/token-supply/route.js
export async function GET() {
    try {
      // Use the correct endpoint for token supply
      const backendUrl = 'http://localhost:3000/supply';
      
      const response = await fetch(backendUrl, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Backend returned error status ${response.status}`);
        return Response.json({ 
          success: false, 
          message: `Backend error: ${response.status}`,
          availableTokens: 40,
          percentageRemaining: 80
        });
      }
      
      const data = await response.json();
      
      // Transform the data into the format expected by the frontend
      // but don't log it to the console
      const transformedData = {
        success: true,
        availableTokens: data.remainingSupply || 40,
        percentageRemaining: Math.round((data.remainingSupply / data.totalSupply) * 100) || 80
      };
      
      return Response.json(transformedData);
    } catch (error) {
      console.error('Error proxying token supply request');
      return Response.json({ 
        success: false, 
        message: `Failed to fetch token supply`,
        availableTokens: 40,
        percentageRemaining: 80
      });
    }
  }