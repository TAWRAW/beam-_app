#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Lire les paramètres depuis les arguments ou les variables d'environnement
const supabaseUrl = process.argv[2] || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.argv[3] || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Usage: node fix-fiche-entretien-link-with-params.js <SUPABASE_URL> <SUPABASE_SERVICE_ROLE_KEY>')
  console.error('   ou définir les variables d\'environnement NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixArticleLink() {
  console.log('🔍 Recherche de l\'article...')

  // Récupérer l'article
  const { data: article, error: fetchError } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', 'fiche-entretien-syndic')
    .single()

  if (fetchError) {
    console.error('❌ Erreur lors de la récupération de l\'article:', fetchError.message)
    process.exit(1)
  }

  if (!article) {
    console.error('❌ Article non trouvé')
    process.exit(1)
  }

  console.log('✅ Article trouvé:', article.title)
  console.log('📄 Longueur du contenu:', article.content.length, 'caractères')

  // Remplacer le texte par un lien
  const oldText = 'Télécharger la fiche d\'entretien syndic (PDF)'
  const newText = '[Télécharger la fiche d\'entretien syndic (PDF)](https://drive.google.com/file/d/190Pit5zEqor_7fbeTMTtqZ3yW2UZvIlB/view)'

  let updatedContent = article.content

  // Vérifier si le lien existe déjà
  if (article.content.includes(newText)) {
    console.log('✅ Le lien est déjà présent dans l\'article. Aucune modification nécessaire.')
    return
  }

  // Chercher et remplacer avec différentes variations d'apostrophes
  const variations = [
    "Télécharger la fiche d'entretien syndic (PDF)",
    "Télécharger la fiche d'entretien syndic (PDF)",
    "Télécharger la fiche d'entretien syndic (PDF)",
  ]

  let found = false
  for (const variation of variations) {
    if (article.content.includes(variation)) {
      console.log(`✓ Trouvé: "${variation}"`)
      updatedContent = article.content.replace(variation, newText)
      found = true
      break
    }
  }

  if (!found) {
    console.error('❌ Le texte à remplacer n\'a pas été trouvé. Recherche partielle...')

    // Recherche partielle
    if (article.content.includes('fiche d') && article.content.includes('entretien syndic')) {
      console.log('⚠️  Des mots-clés ont été trouvés, mais pas la phrase complète.')
      console.log('Aperçu du contenu (premiers 1000 caractères):')
      console.log(article.content.substring(0, 1000))
      console.log('\n... (contenu tronqué) ...\n')
    } else {
      console.error('❌ Aucune correspondance trouvée.')
    }
    process.exit(1)
  }

  // Vérifier que le remplacement a bien eu lieu
  if (updatedContent === article.content) {
    console.error('❌ Le remplacement a échoué')
    process.exit(1)
  }

  console.log('🔄 Mise à jour de l\'article dans Supabase...')

  // Mettre à jour l'article
  const { error: updateError } = await supabase
    .from('articles')
    .update({ content: updatedContent })
    .eq('slug', 'fiche-entretien-syndic')

  if (updateError) {
    console.error('❌ Erreur lors de la mise à jour:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Article mis à jour avec succès!')
  console.log('🔗 Le texte a été transformé en lien vers: https://drive.google.com/file/d/190Pit5zEqor_7fbeTMTtqZ3yW2UZvIlB/view')
}

fixArticleLink()
