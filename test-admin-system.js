// Quick test of the admin system
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAdminSystem() {
  console.log('🧪 Testing Admin System...')
  
  try {
    // Test 1: Basic profiles connection
    const { data: profileCount, error: countError } = await supabase
      .from('profiles')
      .select('count')
    
    if (countError) {
      console.error('❌ Profile count test failed:', countError)
      return
    }
    console.log('✅ Profile count test passed')
    
    // Test 2: Admin login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin.test@ile-legal.com',
      password: 'admin123'
    })
    
    if (authError) {
      console.error('❌ Admin login test failed:', authError)
      return
    }
    console.log('✅ Admin login test passed')
    
    // Test 3: Admin profile access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, user_type')
      .eq('id', authData.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Admin profile test failed:', profileError)
      return
    }
    console.log('✅ Admin profile test passed:', profile)
    
    // Test 4: Admin view access  
    const { data: adminView, error: adminViewError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1)
    
    if (adminViewError) {
      console.error('❌ Admin view test failed:', adminViewError)
      return
    }
    console.log('✅ Admin view test passed')
    
    console.log('🎉 All admin system tests passed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

testAdminSystem()