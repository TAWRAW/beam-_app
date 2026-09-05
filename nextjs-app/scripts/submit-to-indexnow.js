#!/usr/bin/env node

/**
 * Script de soumission à IndexNow (Bing, Yandex, Naver, Seznam...)
 * Usage: node scripts/submit-to-indexnow.js [url...]
 *
 * Si aucune URL n'est fournie, soumet toutes les URLs du sitemap.
 *
 * Contrairement à l'API Google, IndexNow ne demande aucune authentification :
 * la preuve de propriété est le fichier de clé servi à la racine du site.
 */

const https = require('https')

// Configuration
const SITE_URL = 'https://www.xn--beam-yqa.fr'
const HOST = 'www.xn--beam-yqa.fr'
const KEY = '0b84c70e74735ef1c844b90c2d9ba4e0'
const KEY_LOCATION = `${SITE_URL}/${KEY}.txt`
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_URLS_PER_BATCH = 10000

console.log('🚀 Soumission à IndexNow (Bing & autres moteurs)\n')
console.log('='.repeat(60))

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          res.resume()
          reject(new Error(`HTTP ${res.statusCode} sur ${url}`))
          return
        }
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => resolve(body))
      })
      .on('error', reject)
  })
}

async function getSitemapUrls() {
  const xml = await fetchText(`${SITE_URL}/sitemap.xml`)
  const matches = xml.match(/<loc>([^<]+)<\/loc>/g) || []
  return matches.map((loc) => loc.replace(/<\/?loc>/g, '').trim())
}

function submitBatch(urlList) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    })

    const req = https.request(
      ENDPOINT,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => resolve({ status: res.statusCode, body }))
      }
    )

    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

// IndexNow renvoie un code HTTP sec, sans corps explicatif : on le traduit.
function explain(status) {
  switch (status) {
    case 200:
      return '✅ URLs acceptées'
    case 202:
      return '✅ URLs acceptées, clé en cours de validation'
    case 400:
      return '❌ Requête invalide (format des URLs ?)'
    case 403:
      return '❌ Clé refusée : le fichier de clé est-il bien en ligne ?'
    case 422:
      return '❌ URLs hors du domaine déclaré, ou clé ne correspondant pas'
    case 429:
      return '❌ Trop de requêtes, réessayer plus tard'
    default:
      return `⚠️ Réponse inattendue (${status})`
  }
}

async function main() {
  const args = process.argv.slice(2)

  try {
    // Sans le fichier de clé en ligne, toute soumission est rejetée : on vérifie d'abord.
    console.log(`🔑 Vérification de la clé: ${KEY_LOCATION}`)
    const servedKey = (await fetchText(KEY_LOCATION)).trim()
    if (servedKey !== KEY) {
      console.error(`❌ La clé servie ne correspond pas: "${servedKey}"`)
      process.exit(1)
    }
    console.log('   ✅ Clé en ligne et conforme\n')

    let urls = []

    if (args.length > 0) {
      console.log(`📍 Soumission de ${args.length} URL(s) fournie(s)\n`)
      urls = args
    } else {
      console.log('🗺️  Récupération des URLs du sitemap...\n')
      urls = await getSitemapUrls()
      console.log(`✅ ${urls.length} URL(s) trouvée(s)\n`)
    }

    const horsDomaine = urls.filter((url) => !url.startsWith(SITE_URL))
    if (horsDomaine.length > 0) {
      console.error('❌ URLs hors du domaine, soumission annulée:')
      horsDomaine.forEach((url) => console.error(`   - ${url}`))
      process.exit(1)
    }

    console.log('🔄 Soumission en cours...')
    console.log('-'.repeat(60))

    for (let i = 0; i < urls.length; i += MAX_URLS_PER_BATCH) {
      const batch = urls.slice(i, i + MAX_URLS_PER_BATCH)
      const { status, body } = await submitBatch(batch)

      console.log(`\n📤 Lot de ${batch.length} URL(s)`)
      console.log(`   ${explain(status)}`)
      if (body.trim()) {
        console.log(`   Réponse: ${body.trim()}`)
      }

      if (status >= 400) {
        process.exit(1)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(60))
    console.log(`✅ ${urls.length} URL(s) soumise(s)`)
    console.log('\n💡 Note:')
    console.log('   - Une seule soumission suffit pour Bing, Yandex, Naver et Seznam')
    console.log('   - Le crawl reste à la main du moteur (quelques heures à quelques jours)')
    console.log('   - Suivi dans Bing Webmaster Tools > IndexNow')
  } catch (error) {
    console.error('\n❌ Erreur:', error.message)
    process.exit(1)
  }
}

main()
