export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const PublishSchema = z.object({
  article_id: z.string().uuid(),
  platforms: z.array(z.enum(['facebook', 'linkedin', 'instagram', 'tiktok'])).min(1),
  publish_mode: z.enum(['now', 'schedule', 'queue']).default('now'),
  scheduled_for: z.string().datetime().optional(), // ISO 8601 datetime for scheduling
  custom_message: z.string().optional(), // Optional custom message override
})

export async function POST(req: NextRequest) {
  // Auth check via Supabase session
  const supabase = createSupabaseServerClient()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const json = await req.json()
    const parsed = PublishSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 })
    }
    const { article_id, platforms, publish_mode, scheduled_for, custom_message } = parsed.data

    // Fetch article from Supabase
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, content, featured_image_url, published_at, category, tags')
      .eq('id', article_id)
      .eq('status', 'published') // Only published articles can be shared
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: 'Article not found or not published' }, { status: 404 })
    }

    // Build article URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beamô.fr'
    const articleUrl = `${siteUrl}/ressources/articles/${article.slug}`

    // Prepare payload for n8n
    const webhookUrl = process.env.N8N_SOCIAL_WEBHOOK_URL
    const token = process.env.N8N_SOCIAL_TOKEN
    const basicUser = process.env.N8N_SOCIAL_BASIC_USER
    const basicPass = process.env.N8N_SOCIAL_BASIC_PASS

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (basicUser && basicPass) {
      const b64 = Buffer.from(`${basicUser}:${basicPass}`).toString('base64')
      headers['Authorization'] = `Basic ${b64}`
    } else if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const authMode = basicUser && basicPass ? 'basic' : token ? 'bearer' : 'none'

    // Calculate scheduled_for for queue mode
    let finalScheduledFor = scheduled_for
    if (publish_mode === 'queue') {
      // For queue mode, we'll let n8n handle the scheduling based on queue settings
      // Send a special marker to indicate it's a queue item
      finalScheduledFor = 'queue'
    }

    const payload = {
      source: 'site-app',
      userId: user.id,
      action: publish_mode, // 'now', 'schedule', or 'queue'
      payload: {
        article: {
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          url: articleUrl,
          image_url: article.featured_image_url,
          category: article.category,
          tags: article.tags,
        },
        platforms,
        scheduled_for: finalScheduledFor,
        custom_message,
      },
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    // Try to parse JSON, otherwise capture text for debugging
    const text = await res.text()
    let out: any
    try { out = JSON.parse(text) } catch { out = null }

    if (!res.ok) {
      return NextResponse.json(
        {
          error: (out && out.error) || 'Webhook error',
          upstream: { status: res.status, body: out ?? text, auth: authMode },
        },
        { status: 502 },
      )
    }

    return NextResponse.json(out ?? { ok: true, platforms, article_id })
  } catch (e: any) {
    console.error('Social publishing error:', e)
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 })
  }
}
