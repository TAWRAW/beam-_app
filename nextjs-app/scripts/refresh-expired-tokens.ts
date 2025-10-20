#!/usr/bin/env ts-node
/**
 * Script de maintenance pour rafraîchir les tokens expirés
 *
 * Usage:
 *   npm run refresh-tokens
 *
 * ou avec des options:
 *   npm run refresh-tokens -- --days=7  (rafraîchir tokens expirant dans 7 jours)
 *   npm run refresh-tokens -- --force   (rafraîchir tous les tokens)
 *
 * Date: 20 octobre 2025
 */

import { createClient } from '@supabase/supabase-js'
import { getPublisher } from '../src/lib/services/social-publishing/factory'
import { decryptToken, encryptToken } from '../src/lib/crypto/token-encryption'
import type { SocialIntegration, SocialPlatform } from '../src/types/social-integration'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

// Créer le client Supabase avec le service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface ScriptOptions {
  daysBeforeExpiry: number
  force: boolean
  dryRun: boolean
}

/**
 * Parse les arguments de la ligne de commande
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2)

  let daysBeforeExpiry = 7
  let force = false
  let dryRun = false

  for (const arg of args) {
    if (arg.startsWith('--days=')) {
      daysBeforeExpiry = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--force') {
      force = true
    } else if (arg === '--dry-run') {
      dryRun = true
    }
  }

  return { daysBeforeExpiry, force, dryRun }
}

/**
 * Récupère les intégrations qui nécessitent un refresh
 */
async function getIntegrationsToRefresh(
  options: ScriptOptions
): Promise<SocialIntegration[]> {
  const query = supabase
    .from('social_integrations')
    .select('*')

  if (!options.force) {
    // Calculer la date limite
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() + options.daysBeforeExpiry)

    query.lte('token_expires_at', limitDate.toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching integrations:', error)
    return []
  }

  return data || []
}

/**
 * Rafraîchit le token d'une intégration
 */
async function refreshIntegration(
  integration: SocialIntegration,
  dryRun: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const platform = integration.platform as SocialPlatform

    console.log(`🔄 Refreshing token for ${platform} (user: ${integration.user_id})`)

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

    // Rafraîchir le token
    const publisher = getPublisher(platform)
    const newAccessToken = await publisher.refreshToken(decryptedIntegration)

    if (!newAccessToken) {
      return {
        success: false,
        error: 'Failed to refresh token - platform may not support refresh'
      }
    }

    if (dryRun) {
      console.log(`  ✅ [DRY RUN] Would update token for ${platform}`)
      return { success: true }
    }

    // Chiffrer le nouveau token
    const encryptedNewToken = encryptToken(newAccessToken)

    // Mettre à jour dans la base de données
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 60) // 60 jours par défaut

    const { error: updateError } = await supabase
      .from('social_integrations')
      .update({
        access_token: encryptedNewToken,
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        error_count: 0,
        last_error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id)

    if (updateError) {
      return {
        success: false,
        error: `Database update failed: ${updateError.message}`
      }
    }

    console.log(`  ✅ Successfully refreshed token for ${platform}`)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`  ❌ Error refreshing ${integration.platform}:`, errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting token refresh script...\n')

  const options = parseArgs()

  console.log('Options:')
  console.log(`  Days before expiry: ${options.daysBeforeExpiry}`)
  console.log(`  Force refresh all: ${options.force}`)
  console.log(`  Dry run: ${options.dryRun}`)
  console.log('')

  // Récupérer les intégrations à rafraîchir
  const integrations = await getIntegrationsToRefresh(options)

  console.log(`📊 Found ${integrations.length} integration(s) to refresh\n`)

  if (integrations.length === 0) {
    console.log('✨ No integrations need refreshing. All good!')
    return
  }

  // Grouper par plateforme pour affichage
  const byPlatform = integrations.reduce((acc, integration) => {
    const platform = integration.platform
    if (!acc[platform]) acc[platform] = []
    acc[platform].push(integration)
    return acc
  }, {} as Record<string, SocialIntegration[]>)

  for (const [platform, platformIntegrations] of Object.entries(byPlatform)) {
    console.log(`\n📱 ${platform.toUpperCase()}: ${platformIntegrations.length} integration(s)`)
  }

  console.log('\n---\n')

  // Rafraîchir chaque intégration
  let successCount = 0
  let errorCount = 0

  for (const integration of integrations) {
    const result = await refreshIntegration(integration, options.dryRun)

    if (result.success) {
      successCount++
    } else {
      errorCount++
    }

    // Petit délai pour éviter rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n---\n')
  console.log('📊 Summary:')
  console.log(`  ✅ Success: ${successCount}`)
  console.log(`  ❌ Errors: ${errorCount}`)
  console.log(`  📝 Total: ${integrations.length}`)

  if (options.dryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to actually refresh tokens.')
  }

  console.log('\n✨ Done!')
}

// Execute
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
