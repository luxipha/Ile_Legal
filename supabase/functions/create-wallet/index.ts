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

interface CircleWalletResponse {
  data: {
    wallet: {
      id: string
      state: string
      walletSetId: string
      custodyType: string
      address?: string
      blockchain: string
      accountType: string
      updateDate: string
      createDate: string
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Circle API credentials
    const circleApiKey = Deno.env.get('CIRCLE_API_KEY')
    const circleApiUrl = Deno.env.get('CIRCLE_API_URL') || 'https://api-sandbox.circle.com'

    if (!circleApiKey) {
      throw new Error('Circle API key not configured')
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
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const requestBody: CreateWalletRequest = await req.json()
    const { userId, userType, name, email } = requestBody

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
      return new Response(
        JSON.stringify({ 
          success: true, 
          wallet: existingWallet,
          message: 'Wallet already exists' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create wallet with Circle API
    const walletDescription = `${userType.charAt(0).toUpperCase() + userType.slice(1)} wallet for ${name}`
    
    const circleResponse = await fetch(`${circleApiUrl}/v1/w3s/wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${circleApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountType: 'SCA',
        blockchains: ['MATIC-AMOY'], // Polygon testnet
        description: walletDescription,
        walletSetId: Deno.env.get('CIRCLE_WALLET_SET_ID'),
      })
    })

    if (!circleResponse.ok) {
      const errorText = await circleResponse.text()
      console.error('Circle API Error:', errorText)
      throw new Error(`Circle API error: ${circleResponse.status} - ${errorText}`)
    }

    const circleData: CircleWalletResponse = await circleResponse.json()
    const wallet = circleData.data.wallet

    // Store wallet in database
    const { data: savedWallet, error: dbError } = await supabase
      .from('user_wallets')
      .insert({
        user_id: userId,
        circle_wallet_id: wallet.id,
        wallet_address: wallet.address || null,
        wallet_state: wallet.state,
        blockchain: wallet.blockchain,
        account_type: wallet.accountType,
        custody_type: wallet.custodyType,
        wallet_set_id: wallet.walletSetId,
        description: walletDescription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save wallet to database')
    }

    // Log wallet creation activity
    await supabase
      .from('user_activities')
      .insert({
        user_id: userId,
        activity_type: 'wallet_created',
        description: `Created ${userType} wallet`,
        metadata: {
          wallet_id: wallet.id,
          wallet_address: wallet.address
        },
        created_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        wallet: savedWallet,
        circle_wallet: wallet,
        message: 'Wallet created successfully'
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Wallet creation error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create wallet',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})