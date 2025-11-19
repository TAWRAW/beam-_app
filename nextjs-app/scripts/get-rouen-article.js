#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getArticle() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', 'syndics-coproprietes-rouen-76')
    .single()

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log(JSON.stringify(data, null, 2))
}

getArticle()
