# Gestionnaire d'Articles - Roadmap Complète

## 🎯 Vue d'ensemble
Migration de Strapi vers Supabase pour créer un gestionnaire d'articles intégré avec optimisation SEO complète pour Beamô.

## 🗃️ Structure de la base de données

### Table `articles`
```sql
CREATE TABLE articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    meta_description TEXT,
    content TEXT NOT NULL, -- Contenu markdown
    excerpt TEXT, -- Résumé pour les listings
    featured_image_url TEXT,
    author_id UUID REFERENCES profiles(id),
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    seo_title TEXT, -- Titre SEO spécifique (différent du titre si besoin)
    seo_keywords TEXT, -- Mots-clés pour SEO
    reading_time_minutes INTEGER, -- Temps de lecture estimé
    views_count INTEGER DEFAULT 0, -- Compteur de vues
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_author ON articles(author_id);
CREATE INDEX idx_articles_category ON articles(category);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_articles_updated_at 
    BEFORE UPDATE ON articles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### Policies RLS
```sql
-- Lecture publique des articles publiés
CREATE POLICY "Articles publiés lisibles par tous" ON articles
    FOR SELECT USING (status = 'published');

-- Gestion complète pour admins/employés
CREATE POLICY "Gestion articles pour admins" ON articles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'employe')
        )
    );

-- Auteurs peuvent gérer leurs propres articles
CREATE POLICY "Auteurs gèrent leurs articles" ON articles
    FOR ALL USING (author_id = auth.uid());
```

## 📁 Structure des fichiers

### Types TypeScript
- `src/types/article.ts` - Types pour les articles
- `src/types/api.ts` - Types pour les APIs

### APIs
- `src/app/api/articles/route.ts` - GET (liste) / POST (création)
- `src/app/api/articles/[id]/route.ts` - GET/PUT/DELETE article spécifique
- `src/app/api/articles/[id]/publish/route.ts` - Publication d'article
- `src/app/api/articles/slug/[slug]/route.ts` - Récupération par slug
- `src/app/api/upload/images/route.ts` - Upload d'images

### Interface Admin
- `src/app/apps/articles/page.tsx` - Liste des articles
- `src/app/apps/articles/new/page.tsx` - Création d'article
- `src/app/apps/articles/[id]/edit/page.tsx` - Édition d'article
- `src/app/apps/articles/columns.tsx` - Colonnes DataTable
- `src/components/articles/ArticleForm.tsx` - Formulaire d'article
- `src/components/articles/MarkdownEditor.tsx` - Éditeur markdown
- `src/components/articles/ImageUpload.tsx` - Upload d'images

### Frontend Public
- `src/app/ressources/page.tsx` - Liste des articles (migration)
- `src/app/ressources/[slug]/page.tsx` - Article individuel (migration)
- `src/components/articles/ArticleCard.tsx` - Carte d'article
- `src/components/articles/ArticleContent.tsx` - Rendu du contenu

## 🎨 Fonctionnalités SEO

### Métadonnées automatiques
- Titre optimisé (seo_title ou title)
- Meta description (meta_description ou excerpt)
- Open Graph tags
- Twitter Cards
- Schema.org Article markup
- Canonical URLs

### Optimisation du contenu
- Génération automatique des excerpts
- Calcul du temps de lecture
- Optimisation des images (alt, title)
- URLs SEO-friendly avec slugs
- Sitemap.xml dynamique

## 🚀 Plan d'implémentation

### Phase 1: Foundation (Jour 1)
1. ✅ Documentation roadmap
2. 🔄 Création table Supabase + RLS
3. 🔄 Types TypeScript
4. 🔄 API de base (CRUD)

### Phase 2: Admin Interface (Jour 2)
5. Interface de liste des articles
6. Formulaire de création/édition
7. Éditeur markdown avec prévisualisation
8. Gestion des images

### Phase 3: Frontend Public (Jour 3)
9. Migration page ressources
10. Page article individuelle optimisée
11. Métadonnées SEO automatiques
12. Composants réutilisables

### Phase 4: Fonctionnalités avancées (Jour 4)
13. Système de brouillons/publication
14. Gestion des catégories et tags
15. Analytics basiques
16. Sitemap dynamique

## 📊 Fonctionnalités prévues

### Édition d'articles
- [x] Titre et slug automatique
- [x] Contenu markdown avec prévisualisation
- [x] Meta description et mots-clés SEO
- [x] Image de couverture
- [x] Catégories et tags
- [x] Statut (brouillon/publié/archivé)
- [x] Programmation de publication

### Gestion administrative
- [x] Liste avec filtres et recherche
- [x] Actions en lot (publier, archiver, supprimer)
- [x] Statistiques de vues
- [x] Gestion des auteurs
- [x] Export/import d'articles

### Optimisation SEO
- [x] Métadonnées complètes
- [x] Schema.org markup
- [x] Sitemap automatique
- [x] URLs optimisées
- [x] Temps de lecture
- [x] Optimisation images

## 🔧 Configuration technique

### Dépendances à ajouter
- `react-markdown` - Rendu markdown
- `remark-gfm` - Support GitHub Flavored Markdown
- `@uiw/react-md-editor` - Éditeur markdown
- `slugify` - Génération de slugs

### Variables d'environnement
Aucune nouvelle variable requise, utilise Supabase existant.

## 📈 Métriques de succès
- Migration complète de Strapi → Supabase
- Interface admin complète et intuitive
- SEO score élevé pour les articles
- Temps de chargement optimisé
- Expérience utilisateur fluide

---

**Dernière mise à jour :** 22 septembre 2025
**Statut :** 🔄 En cours de développement
**Responsable :** Tom Lemeille