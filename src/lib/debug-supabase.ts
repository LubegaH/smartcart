// Comprehensive Supabase debugging utilities

export async function debugSupabaseEnvironment() {
  console.log('🔍 === SUPABASE ENVIRONMENT DEBUG ===')
  
  // Check if we're in browser
  const isBrowser = typeof window !== 'undefined'
  console.log('🌐 Environment:', isBrowser ? 'Browser' : 'Server')
  
  // Check environment variables
  console.log('📋 Environment Variables:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + '...')
  console.log('  Length check - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.length)
  console.log('  Length check - KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
  
  // Validate URL format
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url) {
    console.log('🔗 URL Validation:')
    console.log('  Starts with https:', url.startsWith('https://'))
    console.log('  Contains supabase.co:', url.includes('supabase.co'))
    console.log('  Valid URL format:', /^https:\/\/[a-z]+\.supabase\.co$/.test(url))
  }
}

export async function debugNetworkConnectivity() {
  console.log('🌐 === NETWORK CONNECTIVITY TEST ===')
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('❌ Missing environment variables for network test')
    return
  }
  
  // Test 1: Basic fetch to Supabase
  console.log('🧪 Test 1: Basic connectivity')
  try {
    const response = await fetch(url)
    console.log('✅ Basic fetch result:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    })
  } catch (error) {
    console.error('❌ Basic fetch failed:', error)
  }
  
  // Test 2: Supabase REST API endpoint
  console.log('🧪 Test 2: REST API endpoint')
  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    })
    console.log('✅ REST API result:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
  } catch (error) {
    console.error('❌ REST API test failed:', error)
  }
  
  // Test 3: Auth endpoint specifically
  console.log('🧪 Test 3: Auth endpoint')
  try {
    const response = await fetch(`${url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testtest'
      })
    })
    const responseText = await response.text()
    console.log('✅ Auth endpoint result:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      response: responseText.substring(0, 200)
    })
  } catch (error) {
    console.error('❌ Auth endpoint test failed:', error)
  }
}

export async function debugSupabaseClient() {
  console.log('🔧 === SUPABASE CLIENT DEBUG ===')
  
  try {
    // Dynamic import to avoid issues
    const { supabase } = await import('./supabase')
    
    console.log('✅ Supabase client imported successfully')
    
    // Test client configuration
    console.log('🔍 Client configuration check')
    
    // Test basic client method
    try {
      const { data, error } = await supabase.auth.getSession()
      console.log('✅ getSession() test:', { hasData: !!data, error: error?.message })
    } catch (clientError) {
      console.error('❌ Client method failed:', clientError)
    }
    
  } catch (importError) {
    console.error('❌ Failed to import Supabase client:', importError)
  }
}

export async function runFullDiagnostic() {
  console.log('🚀 === FULL SUPABASE DIAGNOSTIC ===')
  
  await debugSupabaseEnvironment()
  await debugNetworkConnectivity()
  await debugSupabaseClient()
  
  console.log('🏁 === DIAGNOSTIC COMPLETE ===')
}