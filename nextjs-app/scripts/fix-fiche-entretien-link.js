#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixArticleLink() {
  // Récupérer l'article
  const { data: article, error: fetchError } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', 'fiche-entretien-syndic')
    .single()

  if (fetchError) {
    console.error('Erreur lors de la récupération de l\'article:', fetchError.message)
    process.exit(1)
  }

  if (!article) {
    console.error('Article non trouvé')
    process.exit(1)
  }

  console.log('Article trouvé:', article.title)
  console.log('Contenu actuel:')
  console.log(article.content)
  console.log('\n---\n')

  // Remplacer le texte par un lien
  const oldText = 'Télécharger la fiche d\'entretien syndic (PDF)'
  const newText = '[Télécharger la fiche d\'entretien syndic (PDF)](https://drive.google.com/file/d/190Pit5zEqor_7fbeTMTtqZ3yW2UZvIlB/view)'

  let updatedContent = article.content.replace(oldText, newText)

  if (updatedContent === article.content) {
    console.log('⚠️  Le texte à remplacer n\'a pas été trouvé. Contenu actuel:')
    console.log(article.content)
    console.log('\nRecherche de variations...')

    // Essayer d'autres variations possibles
    const variations = [
      "Télécharger la fiche d'entretien syndic (PDF)",
      "Télécharger la fiche d'entretien syndic (PDF)",
      "Télécharger la fiche d'entretien syndic (PDF)",
    ]

    for (const variation of variations) {
      if (article.content.includes(variation)) {
        console.log(`✓ Trouvé variation: "${variation}"`)
        updatedContent = article.content.replace(variation, newText)
        break
      }
    }

    if (updatedContent === article.content) {
      console.error('❌ Aucune variation trouvée. Abandon.')
      process.exit(1)
    }
  }

  // Mettre à jour l'article
  const { error: updateError } = await supabase
    .from('articles')
    .update({ content: updatedContent })
    .eq('slug', 'fiche-entretien-syndic')

  if (updateError) {
    console.error('Erreur lors de la mise à jour:', updateError.message)
    process.exit(1)
  }

  console.log('✅ Article mis à jour avec succès!')
  console.log('Nouveau contenu:')
  console.log(updatedContent)
}

fixArticleLink()
