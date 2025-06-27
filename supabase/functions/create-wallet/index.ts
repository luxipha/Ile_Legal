import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
  }
  return bytes
}

// Convert Uint8Array to base64 string
function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Parse PEM public key to get the key data
function parsePemPublicKey(pemKey: string): Uint8Array {
  const base64Key = pemKey
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .trim()
  
  return new Uint8Array(atob(base64Key).split('').map(char => char.charCodeAt(0)))
}

// Function to generate fresh entity secret ciphertext using Web Crypto API
async function generateFreshEntitySecretCiphertext(entitySecretHex: string, publicKeyPem: string): Promise<string> {
  try {
    console.log('🔐 Starting Web Crypto encryption...')
    
    // Convert hex entity secret to bytes
    const entitySecretBytes = hexToBytes(entitySecretHex)
    console.log('📝 Entity secret bytes length:', entitySecretBytes.length)
    
    // Parse the PEM public key
    const publicKeyData = parsePemPublicKey(publicKeyPem)
    console.log('🔑 Public key data length:', publicKeyData.length)
    
    // Import the public key for Web Crypto API
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyData,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    )
    console.log('🔑 Public key imported successfully')
    
    // Encrypt using RSA-OAEP with SHA-256
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      entitySecretBytes
    )
    console.log('🔒 Encryption completed')
    
    // Convert to base64
    const ciphertext = bytesToBase64(new Uint8Array(encryptedData))
    console.log('📏 Final ciphertext length:', ciphertext.length)
    
    return ciphertext
    
  } catch (error) {
    console.error('❌ Entity secret encryption failed:', error)
    throw new Error(`Failed to encrypt entity secret: ${error.message}`)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Debug Circle API test started (no auth required)')
    
    // Skip all authentication for debug test
    
    // Get Circle API credentials
    const circleApiKey = Deno.env.get('CIRCLE_API_KEY')
    const circleApiUrl = Deno.env.get('CIRCLE_API_URL') || 'https://api.circle.com'
    const circleEntitySecretHex = Deno.env.get('CIRCLE_ENTITY_SECRET_HEX')
    const circlePublicKey = Deno.env.get('CIRCLE_PUBLIC_KEY')
    const walletSetId = Deno.env.get('CIRCLE_WALLET_SET_ID')

    console.log('🔧 Environment check:', {
      hasApiKey: !!circleApiKey,
      hasEntitySecret: !!circleEntitySecretHex,
      hasPublicKey: !!circlePublicKey,
      hasWalletSetId: !!walletSetId,
      apiUrl: circleApiUrl
    })

    if (!circleApiKey || !circleEntitySecretHex || !circlePublicKey || !walletSetId) {
      throw new Error('Missing Circle configuration')
    }

    // Generate UUID v4 for idempotency
    const idempotencyKey = crypto.randomUUID()
    console.log('🆔 Generated idempotency key:', idempotencyKey)
    
    // Generate fresh entity secret ciphertext using Web Crypto API
    const entitySecretCiphertext = await generateFreshEntitySecretCiphertext(
      circleEntitySecretHex,
      circlePublicKey
    )
    console.log('🔒 Generated ciphertext preview:', entitySecretCiphertext.substring(0, 50) + '...')
    
    console.log('📡 Making Circle API request:', {
      url: `${circleApiUrl}/v1/w3s/developer/wallets`,
      walletSetId,
      idempotencyKey,
      blockchains: ['MATIC-AMOY'],
      ciphertextLength: entitySecretCiphertext.length
    })
    
    const circleResponse = await fetch(`${circleApiUrl}/v1/w3s/developer/wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${circleApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idempotencyKey: idempotencyKey,
        blockchains: ['MATIC-AMOY'],
        entitySecretCiphertext: entitySecretCiphertext,
        walletSetId: walletSetId
      })
    })

    const responseText = await circleResponse.text()
    console.log('📊 Circle API response status:', circleResponse.status)
    console.log('📄 Circle API response:', responseText)

    if (!circleResponse.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Circle API failed',
          status: circleResponse.status,
          response: responseText,
          debug: {
            ciphertextLength: entitySecretCiphertext.length,
            idempotencyKey,
            walletSetId
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const circleData = JSON.parse(responseText)

    return new Response(
      JSON.stringify({
        success: true,
        circle_response: circleData,
        debug: {
          message: 'Web Crypto encryption worked!',
          ciphertextLength: entitySecretCiphertext.length,
          idempotencyKey
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Debug test error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Debug test failed',
        details: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})