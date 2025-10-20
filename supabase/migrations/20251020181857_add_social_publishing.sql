-- Migration: Add social media publishing tracking
-- Date: 2025-10-20
-- Description: Ajoute les colonnes de tracking de publication sur Facebook et LinkedIn

-- Étape 1: Ajouter les colonnes de tracking de publication sur réseaux sociaux
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS published_on_facebook TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS published_on_linkedin TIMESTAMPTZ DEFAULT NULL;

-- Étape 2: Créer un index composite pour optimiser les requêtes n8n
-- Permet de retrouver rapidement les articles publiés mais non postés sur les réseaux
CREATE INDEX IF NOT EXISTS idx_articles_social_publishing
ON articles(status, published_on_facebook, published_on_linkedin)
WHERE status = 'published';

-- Étape 3: Ajouter des commentaires pour la documentation
COMMENT ON COLUMN articles.published_on_facebook IS 'Date et heure de publication sur Facebook (NULL = non publié)';
COMMENT ON COLUMN articles.published_on_linkedin IS 'Date et heure de publication sur LinkedIn (NULL = non publié)';

-- Étape 4: Fonction helper pour obtenir les articles à publier sur un réseau
CREATE OR REPLACE FUNCTION get_articles_pending_social_publishing(
  p_platform TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  published_at TIMESTAMPTZ,
  published_on_facebook TIMESTAMPTZ,
  published_on_linkedin TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.featured_image_url,
    a.published_at,
    a.published_on_facebook,
    a.published_on_linkedin
  FROM articles a
  WHERE a.status = 'published'
    AND a.published_at IS NOT NULL
    AND (
      (p_platform = 'facebook' AND a.published_on_facebook IS NULL)
      OR (p_platform = 'linkedin' AND a.published_on_linkedin IS NULL)
      OR (p_platform = 'all' AND (a.published_on_facebook IS NULL OR a.published_on_linkedin IS NULL))
    )
  ORDER BY a.published_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 5: Fonction helper pour marquer un article comme publié sur un réseau
CREATE OR REPLACE FUNCTION mark_article_published_on_social(
  p_article_id UUID,
  p_platform TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  IF p_platform = 'facebook' THEN
    UPDATE articles
    SET published_on_facebook = NOW()
    WHERE id = p_article_id AND published_on_facebook IS NULL;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  ELSIF p_platform = 'linkedin' THEN
    UPDATE articles
    SET published_on_linkedin = NOW()
    WHERE id = p_article_id AND published_on_linkedin IS NULL;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  ELSE
    RAISE EXCEPTION 'Invalid platform: %. Must be facebook or linkedin', p_platform;
  END IF;

  RETURN v_updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 6: Vérification de la migration
SELECT
  'Social publishing columns added successfully' as status,
  COUNT(*) FILTER (WHERE published_on_facebook IS NULL AND status = 'published') as pending_facebook,
  COUNT(*) FILTER (WHERE published_on_linkedin IS NULL AND status = 'published') as pending_linkedin
FROM articles;
