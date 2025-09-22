-- Création de la table articles pour le gestionnaire de contenu
-- Date: 22 septembre 2025
-- Auteur: Tom Lemeille

-- Table principale pour les articles
CREATE TABLE IF NOT EXISTS articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    meta_description TEXT,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    seo_title TEXT,
    seo_keywords TEXT,
    reading_time_minutes INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_articles_updated_at ON articles;
CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer automatiquement le temps de lecture
CREATE OR REPLACE FUNCTION calculate_reading_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
    -- Estimation : 200 mots par minute
    -- Compte approximatif des mots (espaces + 1)
    RETURN GREATEST(1, ROUND(array_length(string_to_array(content_text, ' '), 1) / 200.0));
END;
$$ language 'plpgsql';

-- Trigger pour calculer automatiquement le temps de lecture
CREATE OR REPLACE FUNCTION update_reading_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reading_time_minutes = calculate_reading_time(NEW.content);
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_articles_reading_time ON articles;
CREATE TRIGGER update_articles_reading_time
    BEFORE INSERT OR UPDATE OF content ON articles
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_time();

-- Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Lecture publique des articles publiés
DROP POLICY IF EXISTS "Articles publiés lisibles par tous" ON articles;
CREATE POLICY "Articles publiés lisibles par tous" ON articles
    FOR SELECT USING (status = 'published');

-- Policy 2: Gestion complète pour admins/employés
DROP POLICY IF EXISTS "Gestion articles pour admins" ON articles;
CREATE POLICY "Gestion articles pour admins" ON articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'employe')
        )
    );

-- Policy 3: Auteurs peuvent gérer leurs propres articles
DROP POLICY IF EXISTS "Auteurs gèrent leurs articles" ON articles;
CREATE POLICY "Auteurs gèrent leurs articles" ON articles
    FOR ALL USING (
        author_id = auth.uid()
    );

-- Données de test (optionnel - à supprimer en production)
INSERT INTO articles (
    title, 
    slug, 
    meta_description, 
    content, 
    excerpt,
    author_id,
    category,
    tags,
    status,
    published_at,
    seo_title,
    seo_keywords
) VALUES (
    'Guide de gestion de copropriété',
    'guide-gestion-copropriete',
    'Découvrez les meilleures pratiques pour gérer efficacement votre copropriété avec Beamô.',
    '# Guide de gestion de copropriété

## Introduction

La gestion de copropriété est un domaine complexe qui nécessite une expertise particulière...

## Les points clés

1. **Communication** - Maintenir un dialogue constant avec les copropriétaires
2. **Transparence** - Assurer une gestion financière claire
3. **Réactivité** - Répondre rapidement aux problèmes

## Conclusion

Une bonne gestion de copropriété repose sur ces principes fondamentaux.',
    'Découvrez les meilleures pratiques pour gérer efficacement votre copropriété.',
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    'guides',
    ARRAY['copropriété', 'gestion', 'immobilier'],
    'published',
    NOW(),
    'Guide complet de gestion de copropriété - Beamô',
    'gestion copropriété, syndic, immobilier, beamô'
) ON CONFLICT (slug) DO NOTHING;

-- Vérification de la création
SELECT 
    'Articles table created successfully' as status,
    COUNT(*) as example_articles_count
FROM articles;