-- Migration: Ajouter les champs type et attachment_url aux articles
-- Date: 23 septembre 2025

-- Ajouter le type ENUM pour ArticleType
CREATE TYPE article_type AS ENUM ('articles', 'modeles', 'applications', 'juridique', 'documentation');

-- Ajouter les nouvelles colonnes à la table articles
ALTER TABLE articles 
ADD COLUMN type article_type DEFAULT 'articles' NOT NULL,
ADD COLUMN attachment_url TEXT;

-- Créer un index pour améliorer les performances des requêtes par type
CREATE INDEX idx_articles_type ON articles(type);

-- Créer un index composé pour les requêtes par statut et type
CREATE INDEX idx_articles_status_type ON articles(status, type);

-- Mettre à jour les articles existants avec un type par défaut basé sur leur catégorie
UPDATE articles SET type = CASE 
  WHEN category = 'guides' THEN 'articles'::article_type
  WHEN category = 'actualites' THEN 'articles'::article_type
  WHEN category = 'conseils' THEN 'articles'::article_type
  WHEN category = 'reglementation' THEN 'juridique'::article_type
  ELSE 'articles'::article_type
END;

-- Ajouter un commentaire pour documenter les colonnes
COMMENT ON COLUMN articles.type IS 'Type de contenu: articles, modeles, applications, juridique, documentation';
COMMENT ON COLUMN articles.attachment_url IS 'URL de pièce jointe (ex: Google Drive) pour les modèles et documents';