-- Script SQL pour corriger le lien de téléchargement de la fiche d'entretien syndic
-- À exécuter dans le SQL Editor de Supabase

-- Mettre à jour le contenu de l'article pour transformer le texte en lien
UPDATE articles
SET content = REPLACE(
  content,
  'Télécharger la fiche d''entretien syndic (PDF)',
  '[Télécharger la fiche d''entretien syndic (PDF)](https://drive.google.com/file/d/190Pit5zEqor_7fbeTMTtqZ3yW2UZvIlB/view)'
)
WHERE slug = 'fiche-entretien-syndic'
AND content LIKE '%Télécharger la fiche d''entretien syndic (PDF)%';

-- Vérifier le résultat
SELECT
  slug,
  title,
  SUBSTRING(content, 1, 500) as content_preview
FROM articles
WHERE slug = 'fiche-entretien-syndic';
