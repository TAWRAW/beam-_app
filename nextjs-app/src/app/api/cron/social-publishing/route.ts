// Cron Job pour la publication automatique sur les réseaux sociaux
// Appelé par Vercel Cron toutes les 15 minutes
// Date: 20 octobre 2025

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getPublisher } from '@/lib/services/social-publishing/factory'
import { shouldPublishNow } from '@/lib/services/social-publishing/scheduler'
import { decryptToken } from '@/lib/crypto/token-encryption'
import type { SocialPlatform, SocialIntegration, PublishParams } from '@/types/social-integration'
import type { SocialPublishingPreferences } from '@/types/social-publishing'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  featured_image_url: string | null
  tags: string[]
  user_id: string
  published_on_facebook: string | null
  published_on_linkedin: string | null
  published_on_instagram: string | null
}

interface Profile {
  id: string
  metadata?: {
    social_publishing_preferences?: SocialPublishingPreferences
  }
}

/**
 * Vérifie la clé d'autorisation du cron job
 */
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('⚠️ CRON_SECRET not configured')
    return process.env.NODE_ENV === 'development' // Permettre en dev
  }

  return authHeader === `Bearer ${cronSecret}`
}

/**
 * Endpoint du cron job
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Vérifier l'autorisation
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚀 Starting social publishing cron job...')

    const supabase = await createSupabaseServerClient()
    const currentTime = new Date()

    // Récupérer tous les profils avec préférences actives
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, metadata')
      .not('metadata->social_publishing_preferences->enabled', 'is', null)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      )
    }

    console.log(`📊 Found ${profiles?.length || 0} profiles to check`)

    let totalPublished = 0
    let totalErrors = 0
    const results: any[] = []

    // Pour chaque profil avec des préférences
    for (const profile of profiles || []) {
      const preferences = profile.metadata?.social_publishing_preferences

      // Vérifier si c'est le bon moment pour publier
      if (!shouldPublishNow(preferences, currentTime)) {
        console.log(`⏭️  Skipping user ${profile.id} - not their publication time`)
        continue
      }

      console.log(`✅ User ${profile.id} - publication time matched!`)

      // Récupérer les intégrations actives de l'utilisateur
      const { data: integrations, error: integrationsError } = await supabase
        .from('social_integrations')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_active', true)

      if (integrationsError || !integrations || integrations.length === 0) {
        console.log(`⚠️  No active integrations for user ${profile.id}`)
        continue
      }

      console.log(`📱 Found ${integrations.length} active integration(s) for user ${profile.id}`)

      // Pour chaque plateforme active
      for (const integration of integrations) {
        const platform = integration.platform as SocialPlatform

        // Récupérer les articles non publiés sur cette plateforme
        const platformColumn = `published_on_${platform}`
        const { data: articles, error: articlesError } = await supabase
          .from('articles')
          .select('id, slug, title, excerpt, featured_image_url, tags, user_id, published_on_facebook, published_on_linkedin, published_on_instagram')
          .eq('user_id', profile.id)
          .eq('status', 'published') // Uniquement les articles publiés
          .is(platformColumn, null) // Non encore publié sur cette plateforme
          .order('created_at', { ascending: false })
          .limit(5) // Limiter à 5 articles max par exécution

        if (articlesError) {
          console.error(`Error fetching articles for ${platform}:`, articlesError)
          continue
        }

        if (!articles || articles.length === 0) {
          console.log(`📭 No articles to publish on ${platform} for user ${profile.id}`)
          continue
        }

        console.log(`📝 Found ${articles.length} article(s) to publish on ${platform}`)

        // Publier chaque article
        for (const article of articles as Article[]) {
          try {
            const result = await publishArticle(article, platform, integration, supabase)
            results.push(result)

            if (result.success) {
              totalPublished++
              console.log(`✅ Published article ${article.slug} to ${platform}`)
            } else {
              totalErrors++
              console.error(`❌ Failed to publish article ${article.slug} to ${platform}:`, result.error)
            }

            // Petit délai entre publications pour éviter rate limiting
            await sleep(2000)
          } catch (error) {
            console.error(`Error publishing article ${article.slug}:`, error)
            totalErrors++
          }
        }
      }
    }

    const duration = Date.now() - startTime

    console.log(`✨ Cron job completed in ${duration}ms`)
    console.log(`📊 Published: ${totalPublished}, Errors: ${totalErrors}`)

    return NextResponse.json({
      success: true,
      published: totalPublished,
      errors: totalErrors,
      duration_ms: duration,
      results: results
    })
  } catch (error) {
    console.error('Fatal error in cron job:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Publie un article sur une plateforme
 */
async function publishArticle(
  article: Article,
  platform: SocialPlatform,
  integration: SocialIntegration,
  supabase: any
): Promise<any> {
  try {
    // Préparer les paramètres de publication
    const publishParams: PublishParams = {
      article_slug: article.slug,
      article_title: article.title,
      article_excerpt: article.excerpt || undefined,
      featured_image_url: article.featured_image_url || undefined,
      tags: article.tags
    }

    // Décrypter les tokens
    const decryptedAccessToken = decryptToken(integration.access_token)
    const decryptedRefreshToken = integration.refresh_token
      ? decryptToken(integration.refresh_token)
      : undefined

    const decryptedIntegration = {
      ...integration,
      access_token: decryptedAccessToken,
      refresh_token: decryptedRefreshToken
    }

    // Publier via le publisher
    const publisher = getPublisher(platform)
    const result = await publisher.publish(publishParams, decryptedIntegration)

    // Mettre à jour l'article
    if (result.success) {
      const updateData: any = {}
      updateData[`published_on_${platform}`] = new Date().toISOString()

      await supabase
        .from('articles')
        .update(updateData)
        .eq('id', article.id)

      // Réinitialiser les erreurs de l'intégration
      await supabase
        .from('social_integrations')
        .update({
          error_count: 0,
          last_error_message: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id)
    } else {
      // Incrémenter les erreurs
      await supabase
        .from('social_integrations')
        .update({
          error_count: (integration.error_count || 0) + 1,
          last_error_message: result.error || 'Publication failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', integration.id)
    }

    return {
      article_id: article.id,
      article_slug: article.slug,
      platform,
      success: result.success,
      error: result.error,
      post_url: result.post_url
    }
  } catch (error) {
    return {
      article_id: article.id,
      article_slug: article.slug,
      platform,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
