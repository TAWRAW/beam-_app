#!/usr/bin/env node

/**
 * Script de soumission automatique à Google Indexing API
 * Usage: node scripts/submit-to-google.js [url]
 *
 * Si aucune URL n'est fournie, soumet tous les articles publiés
 */

const { google } = require('googleapis')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuration
const SITE_URL = 'https://www.xn--beam-yqa.fr'
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json'

console.log('🚀 Soumission à Google Indexing API\n')
console.log('=' .repeat(60))

async function submitToGoogle(url, type = 'URL_UPDATED') {
  try {
    // Charger les credentials du compte de service
    const auth = new google.auth.GoogleAuth({
      keyFile: CREDENTIALS_PATH,
      scopes: ['https://www.googleapis.com/auth/indexing']
    })

    const authClient = await auth.getClient()
    const indexing = google.indexing({ version: 'v3', auth: authClient })

    // Soumettre l'URL
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: type // 'URL_UPDATED' ou 'URL_DELETED'
      }
    })

    return {
      success: true,
      url: url,
      response: response.data
    }
  } catch (error) {
    return {
      success: false,
      url: url,
      error: error.message
    }
  }
}

async function getPublishedArticles() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data, error } = await supabase
    .from('articles')
    .select('slug, title, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    throw new Error(`Erreur Supabase: ${error.message}`)
  }

  return data.map(article => ({
    url: `${SITE_URL}/ressources/${article.slug}`,
    title: article.title
  }))
}

async function main() {
  const args = process.argv.slice(2)

  // Vérifier que les credentials existent
  const fs = require('fs')
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ Fichier de credentials Google introuvable!')
    console.error(`   Chemin recherché: ${CREDENTIALS_PATH}`)
    console.error('\n📝 Configuration requise:')
    console.error('   1. Créer un projet Google Cloud')
    console.error('   2. Activer l\'API Indexing')
    console.error('   3. Créer un compte de service')
    console.error('   4. Télécharger le fichier JSON des credentials')
    console.error(`   5. Placer le fichier dans: ${CREDENTIALS_PATH}`)
    console.error('\n💡 Voir: scripts/GOOGLE_INDEXING_SETUP.md pour le guide complet')
    process.exit(1)
  }

  try {
    let urls = []

    if (args.length > 0) {
      // Soumettre l'URL fournie en argument
      const url = args[0]
      console.log(`📍 Soumission d'une URL spécifique: ${url}\n`)
      urls = [{ url, title: 'URL manuelle' }]
    } else {
      // Soumettre tous les articles publiés
      console.log('📚 Récupération de tous les articles publiés...\n')
      urls = await getPublishedArticles()
      console.log(`✅ ${urls.length} article(s) trouvé(s)\n`)
    }

    console.log('🔄 Soumission en cours...\n')
    console.log('-'.repeat(60))

    const results = {
      success: [],
      failed: []
    }

    for (const { url, title } of urls) {
      console.log(`\n📤 ${title}`)
      console.log(`   ${url}`)

      const result = await submitToGoogle(url)

      if (result.success) {
        console.log('   ✅ Soumis avec succès')
        results.success.push(url)
      } else {
        console.log(`   ❌ Échec: ${result.error}`)
        results.failed.push({ url, error: result.error })
      }

      // Pause entre les requêtes pour éviter les rate limits
      if (urls.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Résumé
    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(60))
    console.log(`✅ Succès: ${results.success.length}`)
    console.log(`❌ Échecs: ${results.failed.length}`)

    if (results.failed.length > 0) {
      console.log('\n❌ URLs en échec:')
      results.failed.forEach(({ url, error }) => {
        console.log(`   - ${url}`)
        console.log(`     Erreur: ${error}`)
      })
    }

    console.log('\n💡 Note:')
    console.log('   - Google peut prendre quelques heures à quelques jours pour crawler')
    console.log('   - Vérifiez le statut dans Google Search Console')
    console.log('   - Quota: 200 URLs/jour maximum')

  } catch (error) {
    console.error('\n❌ Erreur:', error.message)
    process.exit(1)
  }
}

main()
