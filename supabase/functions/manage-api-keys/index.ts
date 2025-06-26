import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApiKeyManagementRequest {
  action: 'rotate' | 'activate' | 'get_health' | 'check_rotation' | 'add_key'
  environment?: 'sandbox' | 'production'
  keyName?: string
  apiKey?: string
  keyId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify authentication - only admins can manage API keys
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('Profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.user_type)) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const requestBody: ApiKeyManagementRequest = await req.json()
    const { action, environment = 'sandbox' } = requestBody

    let result: any

    switch (action) {
      case 'add_key':
        result = await addApiKey(supabase, requestBody.keyName!, requestBody.apiKey!, environment)
        break
      
      case 'activate':
        result = await activateApiKey(supabase, requestBody.keyId!, environment)
        break
      
      case 'rotate':
        result = await rotateApiKey(supabase, environment, requestBody.keyName!, requestBody.apiKey!)
        break
      
      case 'get_health':
        result = await getApiKeyHealth(supabase, environment)
        break
      
      case 'check_rotation':
        result = await checkRotationNeeded(supabase, environment)
        break
      
      default:
        throw new Error(`Unsupported action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API key management error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'API key management failed',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function addApiKey(
  supabase: any, 
  keyName: string, 
  apiKey: string, 
  environment: string
): Promise<any> {
  // Validate the API key by testing it
  const isValid = await validateCircleApiKey(apiKey, environment)
  
  if (!isValid) {
    throw new Error('Invalid Circle API key')
  }

  const { data, error } = await supabase
    .from('circle_api_keys')
    .insert({
      key_name: keyName,
      api_key: apiKey,
      environment,
      is_active: false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add API key: ${error.message}`)
  }

  return { keyId: data.id, message: 'API key added successfully' }
}

async function activateApiKey(supabase: any, keyId: string, environment: string): Promise<any> {
  const { data, error } = await supabase.rpc('activate_api_key', {
    key_id: keyId,
    environment_name: environment
  })

  if (error) {
    throw new Error(`Failed to activate API key: ${error.message}`)
  }

  if (!data) {
    throw new Error('API key not found or already active')
  }

  return { message: 'API key activated successfully' }
}

async function rotateApiKey(
  supabase: any, 
  environment: string, 
  newKeyName: string, 
  newApiKey: string
): Promise<any> {
  // Validate the new API key
  const isValid = await validateCircleApiKey(newApiKey, environment)
  
  if (!isValid) {
    throw new Error('Invalid new Circle API key')
  }

  const { data, error } = await supabase.rpc('rotate_api_key', {
    environment_name: environment,
    new_key_name: newKeyName,
    new_api_key: newApiKey
  })

  if (error) {
    throw new Error(`Failed to rotate API key: ${error.message}`)
  }

  // Auto-activate the new key
  await activateApiKey(supabase, data, environment)

  return { 
    newKeyId: data, 
    message: 'API key rotated and activated successfully' 
  }
}

async function getApiKeyHealth(supabase: any, environment: string): Promise<any> {
  const { data, error } = await supabase.rpc('get_api_key_health', {
    environment_name: environment
  })

  if (error) {
    throw new Error(`Failed to get API key health: ${error.message}`)
  }

  return data
}

async function checkRotationNeeded(supabase: any, environment: string): Promise<any> {
  const { data, error } = await supabase.rpc('check_rotation_needed', {
    environment_name: environment
  })

  if (error) {
    throw new Error(`Failed to check rotation status: ${error.message}`)
  }

  return data[0] || { needs_rotation: false, reason: 'No data available' }
}

async function validateCircleApiKey(apiKey: string, environment: string): Promise<boolean> {
  try {
    const apiUrl = environment === 'production' 
      ? 'https://api.circle.com' 
      : 'https://api-sandbox.circle.com'

    // Test the API key with a simple endpoint
    const response = await fetch(`${apiUrl}/v1/ping`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    })

    return response.ok
  } catch (error) {
    console.error('API key validation error:', error)
    return false
  }
}

// Automatic rotation check (called periodically)
async function performAutomaticRotationCheck(): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const environments = ['sandbox', 'production']

    for (const env of environments) {
      const rotationCheck = await checkRotationNeeded(supabase, env)
      
      if (rotationCheck.needs_rotation) {
        console.log(`⚠️ API key rotation needed for ${env}: ${rotationCheck.reason}`)
        
        // Send notification or alert
        await supabase
          .from('user_activities')
          .insert({
            user_id: '00000000-0000-0000-0000-000000000000', // System user
            activity_type: 'api_key_rotation_alert',
            description: `Circle API key rotation needed for ${env}: ${rotationCheck.reason}`,
            metadata: {
              environment: env,
              reason: rotationCheck.reason,
              current_key_id: rotationCheck.current_key_id,
              expires_in_days: rotationCheck.expires_in_days
            },
            created_at: new Date().toISOString()
          })
      }
    }
  } catch (error) {
    console.error('Automatic rotation check failed:', error)
  }
}