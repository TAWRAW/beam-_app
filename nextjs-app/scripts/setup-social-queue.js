#!/usr/bin/env node

/**
 * Setup script for creating the social_queue table in Supabase
 * Run: node scripts/setup-social-queue.js
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const result = dotenv.config({ path: envPath })
  if (result.error) {
    console.error('❌ Error loading .env.local:', result.error)
    process.exit(1)
  }
  console.log('✅ Loaded environment variables from .env.local')
} else {
  console.error('❌ .env.local file not found')
  process.exit(1)
}

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// SQL to create the social_queue table
const createTableSQL = `
CREATE TABLE IF NOT EXISTS social_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  article_title TEXT NOT NULL,
  article_url TEXT NOT NULL,
  article_excerpt TEXT,
  article_image_url TEXT,
  article_category TEXT,
  article_tags TEXT[],
  platforms TEXT[] NOT NULL,
  custom_message TEXT,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_queue_status ON social_queue(status);
CREATE INDEX IF NOT EXISTS idx_social_queue_scheduled ON social_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_social_queue_article ON social_queue(article_id);
`

async function setupTable() {
  console.log('\n🚀 Setting up social_queue table...\n')

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    })

    if (error) {
      // If exec_sql doesn't exist, try direct SQL execution
      console.log('ℹ️  Trying alternative method...')

      // Split SQL into individual statements
      const statements = createTableSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      for (const statement of statements) {
        console.log(`   Executing: ${statement.substring(0, 50)}...`)
        const { error: execError } = await supabase
          .from('_sql')
          .select()
          .limit(0)
          .then(() => ({ error: new Error('Direct SQL not supported via client') }))

        if (execError) {
          throw new Error(`
❌ Unable to execute SQL directly through the Supabase client.

Please create the table manually using one of these methods:

1. **Supabase Dashboard** (Recommended):
   - Go to: ${supabaseUrl.replace('/rest/v1', '')}/project/_/sql
   - Copy and paste the SQL from: N8N_WORKFLOW_SETUP.md (lines 79-102)
   - Click "Run"

2. **Supabase CLI**:
   npx supabase db push

3. **psql** (if you have direct database access):
   psql <your-database-url> -f scripts/social-queue.sql

The SQL you need to run is in N8N_WORKFLOW_SETUP.md
`)
        }
      }
    }

    console.log('✅ social_queue table created successfully!')
    console.log('\n📋 Table structure:')
    console.log('   - id (UUID, primary key)')
    console.log('   - article_id (UUID, references articles)')
    console.log('   - article_title, article_url, article_excerpt, etc.')
    console.log('   - platforms (TEXT[])')
    console.log('   - status (pending | processing | completed | failed)')
    console.log('   - scheduled_for (TIMESTAMPTZ)')
    console.log('   - published_at (TIMESTAMPTZ)')
    console.log('\n✨ Next steps:')
    console.log('   1. Configure your n8n workflow (see N8N_WORKFLOW_SETUP.md)')
    console.log('   2. Add n8n webhook URL to .env.local:')
    console.log('      N8N_SOCIAL_WEBHOOK_URL=https://your-n8n.com/webhook/social-publishing')
    console.log('   3. Test the queue functionality from the UI')

  } catch (err) {
    console.error('\n' + err.message)
    process.exit(1)
  }
}

setupTable()
