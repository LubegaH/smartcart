import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    // Test 1: Check environment variables
    console.log('📋 Environment variables:')
    console.log('  SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('  SUPABASE_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log('  URL preview:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50))
    console.log('  KEY preview:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + '...')
    
    // Test 1.5: Test basic network connectivity to Supabase
    console.log('🌐 Testing network connectivity...')
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      })
      console.log('🌐 Network test result:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })
    } catch (networkError) {
      console.error('🌐 Network test failed:', networkError)
    }
    
    // Test 2: Test basic connection
    const { data, error } = await supabase.auth.getSession()
    console.log('🔗 Auth session test:', { hasData: !!data, error })
    
    // Test 3: Test a simple query (this will fail if RLS is blocking, but that's OK)
    try {
      const { error: queryError } = await supabase.from('auth').select('*').limit(1)
      console.log('🔗 Query test:', { queryError })
    } catch (queryErr) {
      console.log('🔗 Query test (expected to fail):', queryErr)
    }
    
    return { success: true, message: 'Connection tests completed' }
  } catch (err) {
    console.error('🔗 Connection test failed:', err)
    return { success: false, error: err }
  }
}

export async function testBasicSignUp() {
  try {
    console.log('🧪 Testing basic signup...')
    
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpass123'
    
    console.log('🧪 Attempting signup with:', { email: testEmail, password: '[HIDDEN]' })
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    console.log('🧪 Signup result - data:', data)
    console.log('🧪 Signup result - error:', error)
    
    if (error) {
      console.error('🧪 Full error object:', error)
      console.error('🧪 Error message:', error.message)
      console.error('🧪 Error status:', error.status)
      console.error('🧪 Error code:', error.__isAuthError)
    } else {
      console.log('✅ Signup successful!')
    }
    
    return { data, error }
  } catch (err) {
    console.error('🧪 Signup test failed:', err)
    return { data: null, error: err }
  }
}