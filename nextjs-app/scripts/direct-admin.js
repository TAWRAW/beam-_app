// Direct SQL update to promote admin (bypasses RLS)
const { createClient } = require('@supabase/supabase-js')

function parseArgs() {
  const args = {}
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/)
    if (m) args[m[1]] = m[2]
  }
  return args
}

async function main() {
  const { email } = parseArgs()
  if (!email) {
    console.error('Missing --email argument')
    process.exit(1)
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env')
    process.exit(1)
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Find user by email
  let userId
  let page = 1
  const perPage = 200
  while (!userId) {
    const list = await supabase.auth.admin.listUsers({ page, perPage })
    if (list.error) throw list.error
    const found = list.data.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
    if (found) userId = found.id
    if (!found && list.data.users.length < perPage) break
    page++
  }
  
  if (!userId) {
    throw new Error('User not found')
  }

  console.log('Found user ID:', userId)

  // Use raw SQL query to bypass RLS policies
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    throw error
  }

  // If profile exists, update it. If not, insert it.
  let result
  if (data) {
    // Update existing profile
    result = await supabase
      .rpc('update_user_role_as_service', {
        user_id: userId,
        new_role: 'admin'
      })
  } else {
    // Insert new profile - service role should bypass RLS
    result = await supabase
      .from('profiles')
      .insert({ id: userId, email, role: 'admin' })
  }

  if (result.error) {
    // Last resort: try basic upsert with service key
    console.log('Trying service role direct upsert...')
    const finalAttempt = await supabase
      .schema('public')
      .from('profiles')  
      .upsert({ 
        id: userId, 
        email: email, 
        role: 'admin',
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
    
    if (finalAttempt.error) {
      console.error('All methods failed. Manual intervention needed.')
      console.log('Execute this SQL manually in Supabase SQL Editor:')
      console.log(`UPDATE profiles SET role = 'admin', updated_at = NOW() WHERE id = '${userId}';`)
      throw finalAttempt.error
    }
  }

  console.log('✅ Successfully promoted', email, 'to admin role')
}

main().catch((e) => {
  console.error('Failed:', e.message)
  process.exit(1)
})