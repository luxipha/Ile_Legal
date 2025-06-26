import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WalletOperationRequest {
  operation: 'get_balance' | 'get_address' | 'transfer' | 'get_transactions' | 'create_address'
  walletId?: string
  amount?: string
  recipientAddress?: string
  tokenId?: string
  metadata?: any
}

interface TransferRequest extends WalletOperationRequest {
  operation: 'transfer'
  walletId: string
  amount: string
  recipientAddress: string
  tokenId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Circle API credentials
    const circleApiKey = await getActiveCircleApiKey(supabase)
    const circleApiUrl = Deno.env.get('CIRCLE_API_URL') || 'https://api-sandbox.circle.com'

    if (!circleApiKey) {
      throw new Error('No active Circle API key available')
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

    // Parse request
    const requestBody: WalletOperationRequest = await req.json()
    const { operation } = requestBody

    let result: any

    switch (operation) {
      case 'get_balance':
        result = await getWalletBalance(circleApiUrl, circleApiKey, requestBody.walletId!, user.id, supabase)
        break
      
      case 'get_address':
        result = await getWalletAddress(circleApiUrl, circleApiKey, requestBody.walletId!, user.id, supabase)
        break
      
      case 'create_address':
        result = await createWalletAddress(circleApiUrl, circleApiKey, requestBody.walletId!, user.id, supabase)
        break
      
      case 'transfer':
        const transferReq = requestBody as TransferRequest
        result = await initiateTransfer(circleApiUrl, circleApiKey, transferReq, user.id, supabase)
        break
      
      case 'get_transactions':
        result = await getWalletTransactions(circleApiUrl, circleApiKey, requestBody.walletId!, user.id, supabase)
        break
      
      default:
        throw new Error(`Unsupported operation: ${operation}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Wallet operation error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Wallet operation failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getActiveCircleApiKey(supabase: any): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('circle_api_keys')
      .select('api_key')
      .eq('is_active', true)
      .eq('environment', Deno.env.get('CIRCLE_ENVIRONMENT') || 'sandbox')
      .single()

    if (error || !data) {
      // Fallback to environment variable
      return Deno.env.get('CIRCLE_API_KEY')
    }

    return data.api_key
  } catch (error) {
    console.error('Error fetching Circle API key:', error)
    return Deno.env.get('CIRCLE_API_KEY')
  }
}

async function getWalletBalance(
  apiUrl: string, 
  apiKey: string, 
  walletId: string, 
  userId: string, 
  supabase: any
): Promise<any> {
  // Verify user owns the wallet
  await verifyWalletOwnership(walletId, userId, supabase)

  const response = await fetch(`${apiUrl}/v1/w3s/wallets/${walletId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    throw new Error(`Circle API error: ${response.status}`)
  }

  const data = await response.json()
  
  // Update local balance cache
  if (data.data?.wallet?.accountType) {
    await supabase
      .from('user_wallets')
      .update({
        wallet_state: data.data.wallet.state,
        updated_at: new Date().toISOString()
      })
      .eq('circle_wallet_id', walletId)
  }

  return data.data
}

async function getWalletAddress(
  apiUrl: string, 
  apiKey: string, 
  walletId: string, 
  userId: string, 
  supabase: any
): Promise<any> {
  await verifyWalletOwnership(walletId, userId, supabase)

  const response = await fetch(`${apiUrl}/v1/w3s/wallets/${walletId}/addresses`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    throw new Error(`Circle API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

async function createWalletAddress(
  apiUrl: string, 
  apiKey: string, 
  walletId: string, 
  userId: string, 
  supabase: any
): Promise<any> {
  await verifyWalletOwnership(walletId, userId, supabase)

  const response = await fetch(`${apiUrl}/v1/w3s/wallets/${walletId}/addresses`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      blockchain: 'MATIC-AMOY',
      addressIndex: 0
    })
  })

  if (!response.ok) {
    throw new Error(`Circle API error: ${response.status}`)
  }

  const data = await response.json()
  
  // Update wallet address in database
  if (data.data?.address) {
    await supabase
      .from('user_wallets')
      .update({
        wallet_address: data.data.address,
        updated_at: new Date().toISOString()
      })
      .eq('circle_wallet_id', walletId)
  }

  return data.data
}

async function initiateTransfer(
  apiUrl: string, 
  apiKey: string, 
  transferReq: TransferRequest, 
  userId: string, 
  supabase: any
): Promise<any> {
  await verifyWalletOwnership(transferReq.walletId, userId, supabase)

  const response = await fetch(`${apiUrl}/v1/w3s/wallets/${transferReq.walletId}/transfers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: transferReq.amount,
      destinationAddress: transferReq.recipientAddress,
      tokenId: transferReq.tokenId,
      walletId: transferReq.walletId
    })
  })

  if (!response.ok) {
    throw new Error(`Circle API error: ${response.status}`)
  }

  const data = await response.json()
  
  // Log transfer activity
  await supabase
    .from('user_activities')
    .insert({
      user_id: userId,
      activity_type: 'transfer_initiated',
      description: `Transfer of ${transferReq.amount} ${transferReq.tokenId} to ${transferReq.recipientAddress}`,
      metadata: {
        transfer_id: data.data?.id,
        amount: transferReq.amount,
        token: transferReq.tokenId,
        recipient: transferReq.recipientAddress
      },
      created_at: new Date().toISOString()
    })

  return data.data
}

async function getWalletTransactions(
  apiUrl: string, 
  apiKey: string, 
  walletId: string, 
  userId: string, 
  supabase: any
): Promise<any> {
  await verifyWalletOwnership(walletId, userId, supabase)

  const response = await fetch(`${apiUrl}/v1/w3s/wallets/${walletId}/transactions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  })

  if (!response.ok) {
    throw new Error(`Circle API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data
}

async function verifyWalletOwnership(walletId: string, userId: string, supabase: any): Promise<void> {
  const { data, error } = await supabase
    .from('user_wallets')
    .select('user_id')
    .eq('circle_wallet_id', walletId)
    .single()

  if (error || !data || data.user_id !== userId) {
    throw new Error('Wallet not found or access denied')
  }
}