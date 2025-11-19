#!/usr/bin/env node

/**
 * Script de diagnostic pour vérifier les articles dans le sitemap
 * Usage: node scripts/check-sitemap-articles.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
]

console.log('🔍 Diagnostic du sitemap - Articles\n')
console.log('=' .repeat(60))

// 1. Vérifier les variables d'environnement
console.log('\n1️⃣  Vérification des variables d\'environnement')
console.log('-'.repeat(60))

const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:')
  missingVars.forEach(varName => console.error(`   - ${varName}`))
  console.error('\n💡 Assurez-vous que le fichier .env.local existe et contient ces variables')
  process.exit(1)
}

console.log('✅ Toutes les variables d\'environnement sont définies')
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`)

// 2. Tester la connexion Supabase
console.log('\n2️⃣  Test de connexion à Supabase')
console.log('-'.repeat(60))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkArticles() {
  try {
    // Test 1: Récupérer TOUS les articles (peu importe le statut)
    console.log('\n📊 Tous les articles (tous statuts):')
    const { data: allArticles, error: allError } = await supabase
      .from('articles')
      .select('id, title, slug, status, published_at, created_at')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Erreur:', allError.message)
      return
    }

    if (!allArticles || allArticles.length === 0) {
      console.log('⚠️  Aucun article trouvé dans la base de données')
      console.log('💡 Assurez-vous d\'avoir créé des articles via l\'interface admin')
      return
    }

    console.log(`✅ ${allArticles.length} article(s) trouvé(s)\n`)

    // Afficher les détails de chaque article
    allArticles.forEach((article, index) => {
      console.log(`\n   Article ${index + 1}:`)
      console.log(`   - Titre: ${article.title}`)
      console.log(`   - Slug: ${article.slug}`)
      console.log(`   - Statut: ${article.status}`)
      console.log(`   - Créé le: ${new Date(article.created_at).toLocaleDateString('fr-FR')}`)
      console.log(`   - Publié le: ${article.published_at ? new Date(article.published_at).toLocaleDateString('fr-FR') : 'Non publié'}`)
    })

    // Test 2: Récupérer uniquement les articles publiés (comme le sitemap)
    console.log('\n\n📊 Articles PUBLIÉS (status = "published"):')
    console.log('-'.repeat(60))

    const { data: publishedArticles, error: publishedError } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at, title')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (publishedError) {
      console.error('❌ Erreur:', publishedError.message)
      return
    }

    if (!publishedArticles || publishedArticles.length === 0) {
      console.log('❌ PROBLÈME IDENTIFIÉ: Aucun article avec le statut "published"')
      console.log('\n💡 Solution:')
      console.log('   1. Connectez-vous à l\'interface admin: /apps/articles')
      console.log('   2. Éditez vos articles')
      console.log('   3. Changez leur statut de "draft" à "published"')
      console.log('   4. Vérifiez que la date de publication est définie')
      console.log('\n⚠️  Le sitemap ne peut inclure que les articles avec status="published"')
      return
    }

    console.log(`✅ ${publishedArticles.length} article(s) publié(s)\n`)

    publishedArticles.forEach((article, index) => {
      const url = `https://www.xn--beam-yqa.fr/ressources/${article.slug}`
      console.log(`\n   ${index + 1}. ${article.title}`)
      console.log(`      URL: ${url}`)
      console.log(`      Publié: ${new Date(article.published_at).toLocaleDateString('fr-FR')}`)
    })

    // Test 3: Simuler ce que le sitemap génère
    console.log('\n\n3️⃣  Simulation de la génération du sitemap')
    console.log('-'.repeat(60))
    console.log(`\n✅ Le sitemap devrait contenir ${publishedArticles.length} article(s):\n`)

    publishedArticles.forEach((article, index) => {
      console.log(`   <url>`)
      console.log(`     <loc>https://www.xn--beam-yqa.fr/ressources/${article.slug}</loc>`)
      console.log(`     <lastmod>${new Date(article.updated_at || article.published_at).toISOString()}</lastmod>`)
      console.log(`     <changefreq>monthly</changefreq>`)
      console.log(`     <priority>0.8</priority>`)
      console.log(`   </url>\n`)
    })

    // Résumé final
    console.log('\n' + '='.repeat(60))
    console.log('📋 RÉSUMÉ')
    console.log('='.repeat(60))
    console.log(`Total d'articles: ${allArticles.length}`)
    console.log(`Articles publiés: ${publishedArticles.length}`)
    console.log(`Articles en brouillon: ${allArticles.filter(a => a.status === 'draft').length}`)
    console.log(`Articles archivés: ${allArticles.filter(a => a.status === 'archived').length}`)

    if (publishedArticles.length > 0) {
      console.log('\n✅ Votre sitemap devrait contenir vos articles publiés')
      console.log('💡 Si ce n\'est pas le cas:')
      console.log('   1. Videz le cache Next.js: rm -rf .next')
      console.log('   2. Rebuilder: npm run build')
      console.log('   3. Attendez jusqu\'à 1 heure (revalidation ISR)')
      console.log('   4. Forcez la revalidation via l\'API:')
      console.log('      curl -X POST https://votre-site.fr/api/revalidate \\')
      console.log('        -H "Content-Type: application/json" \\')
      console.log('        -d \'{"secret":"votre-token","path":"/sitemap.xml"}\'')
    } else {
      console.log('\n⚠️  Aucun article publié - le sitemap ne les inclura pas')
      console.log('\n📝 Actions à faire:')
      console.log('   1. Connectez-vous à /apps/articles')
      console.log('   2. Éditez vos articles')
      console.log('   3. Changez leur statut de "draft" à "published"')
      console.log('   4. Définissez une date de publication')
      console.log('   5. Relancez ce script pour vérifier')
    }

  } catch (error) {
    console.error('❌ Exception:', error.message)
    console.error('\n💡 Vérifiez:')
    console.error('   - Que la table "articles" existe dans Supabase')
    console.error('   - Que les migrations ont été exécutées')
    console.error('   - Que les permissions RLS sont correctes')
  }
}

checkArticles()
