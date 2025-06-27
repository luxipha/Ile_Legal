import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { ethers } from "https://esm.sh/ethers@6.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifySignatureRequest {
  address: string;
  message: string;
  signature: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const { address, message, signature }: VerifySignatureRequest = await req.json()

    // Validate required fields
    if (!address || !message || !signature) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: address, message, signature' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the Ethereum signature
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature)
      
      // Check if the recovered address matches the provided address
      const isValid = recoveredAddress.toLowerCase() === address.toLowerCase()
      
      if (!isValid) {
        return new Response(
          JSON.stringify({ 
            error: 'Invalid signature', 
            verified: false 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Log successful verification
      console.log(`✅ Ethereum signature verified for address: ${address}`)

      return new Response(
        JSON.stringify({ 
          verified: true, 
          address: recoveredAddress,
          message: 'Signature verified successfully'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (signatureError) {
      console.error('Signature verification error:', signatureError)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to verify signature', 
          verified: false,
          details: signatureError.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Edge Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})