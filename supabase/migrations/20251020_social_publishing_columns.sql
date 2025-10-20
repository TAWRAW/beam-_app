-- Migration: Ajouter colonne Instagram pour le tracking de publication
-- Date: 20 octobre 2025
-- Note: published_on_facebook et published_on_linkedin existent déjà

-- Ajouter uniquement la colonne Instagram
ALTER TABLE articles ADD COLUMN IF NOT EXISTS published_on_instagram TIMESTAMPTZ;

-- Commentaire
COMMENT ON COLUMN articles.published_on_instagram IS 'Date de publication sur Instagram (NULL = non publié encore)';
