// Create an admin user in Supabase Auth and promote profile role to 'admin'.
// Usage:
//  SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... \
//    node scripts/create-admin.js --email="bonjour@beamo-copro.fr" [--password="Strong#Pass123!"]

const { createClient } = require('@supabase/supabase-js')

function parseArgs() {
  const args = {}
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([^=]+)=(.*)$/)
    if (m) args[m[1]] = m[2]
  }
  return args
}

function generatePassword(len = 24) {
  const crypto = require('crypto')
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+[]{};:,.?'
  const bytes = crypto.randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length]
  return out
}

async function main() {
  const { email, password } = parseArgs()
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

  const supabase = createClient(url, serviceKey)

  let pwd = password || generatePassword()

  // Try to create the user (idempotent-ish): if exists, fetch it
  let userId
  const createRes = await supabase.auth.admin.createUser({
    email,
    password: pwd,
    email_confirm: true,
  })
  if (createRes.error) {
    if (createRes.error.message && createRes.error.message.match(/already exists|User already registered/i)) {
      // Find existing user by listing users (small search)
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
      if (!userId) throw new Error('User exists but could not be found via listUsers')
    } else {
      throw createRes.error
    }
  } else {
    userId = createRes.data.user.id
  }

  // Promote profile to admin
  const upsert = await supabase
    .from('profiles')
    .upsert({ id: userId, role: 'admin', email }, { onConflict: 'id' })
  if (upsert.error) throw upsert.error

  console.log('OK: user id', userId)
  console.log('Email:', email)
  if (!password) console.log('Generated password:', pwd)
}

main().catch((e) => {
  console.error('Failed:', e)
  process.exit(1)
})
