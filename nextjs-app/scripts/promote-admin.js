// Promote existing user to admin role
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
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
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

  // Promote profile to admin using raw SQL to bypass RLS
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      INSERT INTO profiles (id, email, role, updated_at)
      VALUES ($1, $2, 'admin', NOW())
      ON CONFLICT (id)
      DO UPDATE SET role = 'admin', updated_at = NOW()
    `,
    params: [userId, email]
  })
  
  if (error) {
    // Fallback: try direct update (will fail if RLS blocks it)
    console.log('RPC failed, trying direct update...')
    const directUpdate = await supabase
      .from('profiles')
      .upsert({ id: userId, role: 'admin', email, updated_at: new Date().toISOString() })
    if (directUpdate.error) throw directUpdate.error
  }

  console.log('✅ Successfully promoted', email, 'to admin role')
}

main().catch((e) => {
  console.error('Failed:', e)
  process.exit(1)
})