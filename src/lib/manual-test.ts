// Manual test without Supabase client to isolate the issue

export async function manualSupabaseTest() {
  console.log('🔧 === MANUAL SUPABASE TEST ===')
  
  const SUPABASE_URL = 'https://wzwwmnkfqirupeuhbpej.supabase.co'
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6d3dtbmtmcWlydXBldWhicGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NTExNDgsImV4cCI6MjA2NjQyNzE0OH0.AgqoijkpwQ-izkAYRxAnjBb7TaPJ8FOQSn7qWvkQprM'
  
  console.log('🌐 Testing manual signup with hardcoded values...')
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: `manual-test-${Date.now()}@example.com`,
        password: 'manualtest123'
      })
    })
    
    console.log('📡 Response status:', response.status)
    console.log('📡 Response ok:', response.ok)
    
    const responseText = await response.text()
    console.log('📡 Response body:', responseText)
    
    if (response.ok) {
      console.log('✅ Manual signup successful!')
    } else {
      console.log('❌ Manual signup failed')
    }
    
  } catch (error) {
    console.error('❌ Manual test error:', error)
  }
}