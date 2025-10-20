-- Migration pour ajouter la colonne import_source à la table articles
-- Date: 2025-10-15
-- Description: Ajoute le tracking de la source d'importation des articles (manual, notion, api)

-- Étape 1: Ajouter la colonne import_source avec une valeur par défaut NULL
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS import_source TEXT;

-- Étape 2: Ajouter un check constraint pour valider les valeurs possibles
ALTER TABLE articles
ADD CONSTRAINT articles_import_source_check
CHECK (import_source IS NULL OR import_source IN ('manual', 'notion', 'api'));

-- Étape 3 (optionnel): Créer un index pour optimiser les filtres par source
CREATE INDEX IF NOT EXISTS idx_articles_import_source
ON articles(import_source);

-- Étape 4 (optionnel): Mettre à jour les articles existants pour les marquer comme 'manual'
-- Décommenter la ligne suivante si vous voulez marquer tous les articles existants comme créés manuellement
-- UPDATE articles SET import_source = 'manual' WHERE import_source IS NULL;

-- Notes:
-- - Les nouveaux articles importés depuis Notion auront automatiquement import_source = 'notion'
-- - Les articles créés manuellement dans le CMS n'auront pas de source (NULL ou 'manual' si vous exécutez l'étape 4)
-- - Cette colonne est optionnelle (nullable) pour la compatibilité avec les articles existants
