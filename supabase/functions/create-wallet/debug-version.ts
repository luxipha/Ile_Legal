import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateWalletRequest {
  userId: string
  userType: 'buyer' | 'seller'
  name: string
  email: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Edge Function started')
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('✅ Supabase client initialized')

    // Get Circle API credentials
    const circleApiKey = Deno.env.get('CIRCLE_API_KEY')
    const circleApiUrl = Deno.env.get('CIRCLE_API_URL') || 'https://api.circle.com'
    const circleEntitySecretHex = Deno.env.get('CIRCLE_ENTITY_SECRET_HEX')
    const circlePublicKey = Deno.env.get('CIRCLE_PUBLIC_KEY')

    console.log('🔧 Environment variables check:', {
      hasApiKey: !!circleApiKey,
      hasEntitySecret: !!circleEntitySecretHex,
      hasPublicKey: !!circlePublicKey,
      apiUrl: circleApiUrl
    })

    if (!circleApiKey) {
      throw new Error('Circle API key not configured')
    }

    if (!circleEntitySecretHex) {
      throw new Error('Circle entity secret hex not configured')
    }

    if (!circlePublicKey) {
      throw new Error('Circle public key not configured')
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('🔒 Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Parse request body
    const requestBody: CreateWalletRequest = await req.json()
    const { userId, userType, name, email } = requestBody

    console.log('📝 Request data:', { userId, userType, name, email })

    // Validate request
    if (!userId || !userType || !name || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user owns the wallet being created
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized wallet creation' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if wallet already exists
    const { data: existingWallet } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingWallet) {
      console.log('✅ Wallet already exists')
      return new Response(
        JSON.stringify({ 
          success: true, 
          wallet: existingWallet,
          message: 'Wallet already exists' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('🔄 Creating new wallet...')

    // Return debugging info instead of creating wallet
    return new Response(
      JSON.stringify({
        success: false,
        debug: {
          message: 'Debug mode - not creating wallet',
          userId,
          userType,
          environmentCheck: {
            hasApiKey: !!circleApiKey,
            hasEntitySecret: !!circleEntitySecretHex,
            hasPublicKey: !!circlePublicKey,
            apiKeyPrefix: circleApiKey?.substring(0, 20) + '...',
            entitySecretLength: circleEntitySecretHex?.length,
            publicKeyLength: circlePublicKey?.length
          }
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create wallet',
        details: error.message,
        debug: true
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})