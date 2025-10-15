// Types pour le gestionnaire d'articles Beamô
// Date: 22 septembre 2025

export type ArticleStatus = 'draft' | 'published' | 'archived'

export type ArticleCategory = 
  | 'general'
  | 'guides'
  | 'actualites'
  | 'conseils'
  | 'reglementation'
  | 'immobilier'

export type ArticleType = 
  | 'articles'
  | 'modeles'
  | 'applications'
  | 'juridique'
  | 'documentation'

// Source d'importation de l'article
export type ArticleImportSource = 'manual' | 'notion' | 'api'

// Type principal pour un article
export interface Article {
  id: string
  title: string
  slug: string
  meta_description?: string
  content: string
  excerpt?: string
  featured_image_url?: string
  author_id?: string
  category: ArticleCategory
  type: ArticleType
  tags: string[]
  attachment_url?: string
  status: ArticleStatus
  published_at?: string
  seo_title?: string
  seo_keywords?: string
  reading_time_minutes: number
  views_count: number
  import_source?: ArticleImportSource
  created_at: string
  updated_at: string
}

// Type avec les informations de l'auteur populées
export interface ArticleWithAuthor extends Article {
  author?: {
    id: string
    full_name?: string
    email?: string
    avatar_url?: string
  }
}

// Type pour la création d'un nouvel article
export interface CreateArticleRequest {
  title: string
  slug?: string // Généré automatiquement si non fourni
  meta_description?: string
  content: string
  excerpt?: string
  featured_image_url?: string
  author_id?: string
  category?: ArticleCategory
  type?: ArticleType
  tags?: string[]
  attachment_url?: string
  status?: ArticleStatus
  seo_title?: string
  seo_keywords?: string
  published_at?: string
}

// Type pour la mise à jour d'un article
export interface UpdateArticleRequest extends Partial<CreateArticleRequest> {
  id: string
  author_id?: string
}

// Type pour les filtres de recherche
export interface ArticleFilters {
  status?: ArticleStatus | 'all'
  category?: ArticleCategory | 'all'
  import_source?: ArticleImportSource | 'all'
  author_id?: string
  search?: string // Recherche dans titre, excerpt, content
  tags?: string[]
  published_after?: string
  published_before?: string
}

// Type pour les options de tri
export interface ArticleSortOptions {
  field: 'created_at' | 'updated_at' | 'published_at' | 'title' | 'views_count'
  direction: 'asc' | 'desc'
}

// Type pour la pagination
export interface ArticlePagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Type pour les réponses d'API
export interface ArticleListResponse {
  articles: ArticleWithAuthor[]
  pagination: ArticlePagination
  filters: ArticleFilters
  sort: ArticleSortOptions
}

export interface ArticleResponse {
  article: ArticleWithAuthor
}

// Type pour les statistiques d'articles
export interface ArticleStats {
  total: number
  published: number
  drafts: number
  archived: number
  totalViews: number
  averageReadingTime: number
  popularTags: Array<{
    tag: string
    count: number
  }>
  categoriesCount: Array<{
    category: ArticleCategory
    count: number
  }>
}

// Type pour les métadonnées SEO générées
export interface ArticleSEOMetadata {
  title: string
  description: string
  keywords: string[]
  ogTitle: string
  ogDescription: string
  ogImage?: string
  canonicalUrl: string
  jsonLd: object
}

// Type pour l'éditeur markdown
export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
  preview?: boolean
}

// Type pour l'upload d'images
export interface ImageUploadResponse {
  url: string
  filename: string
  size: number
  type: string
}

// Constantes utiles
export const ARTICLE_STATUSES: { value: ArticleStatus; label: string }[] = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publié' },
  { value: 'archived', label: 'Archivé' }
]

export const ARTICLE_CATEGORIES: { value: ArticleCategory; label: string }[] = [
  { value: 'general', label: 'Général' },
  { value: 'guides', label: 'Guides' },
  { value: 'actualites', label: 'Actualités' },
  { value: 'conseils', label: 'Conseils' },
  { value: 'reglementation', label: 'Réglementation' },
  { value: 'immobilier', label: 'Immobilier' }
]

export const ARTICLE_TYPES: { value: ArticleType; label: string }[] = [
  { value: 'articles', label: 'Articles' },
  { value: 'modeles', label: 'Modèles' },
  { value: 'applications', label: 'Applications' },
  { value: 'juridique', label: 'Juridique' },
  { value: 'documentation', label: 'Documentation' }
]

// Helper type guards
export const isValidArticleStatus = (status: string): status is ArticleStatus => {
  return ['draft', 'published', 'archived'].includes(status)
}

export const isValidArticleCategory = (category: string): category is ArticleCategory => {
  return ['general', 'guides', 'actualites', 'conseils', 'reglementation', 'immobilier'].includes(category)
}

export const isValidArticleType = (type: string): type is ArticleType => {
  return ['articles', 'modeles', 'applications', 'juridique', 'documentation'].includes(type)
}

// Utilitaires pour la validation
export interface ArticleValidationErrors {
  title?: string
  slug?: string
  content?: string
  meta_description?: string
  category?: string
  type?: string
  tags?: string
  seo_title?: string
  published_at?: string
}

// Type pour l'importation depuis Notion (via n8n)
export interface NotionArticleImport {
  titre: string
  slug?: string
  contenu: string
  extrait?: string
  categorie?: string
  type?: string
  tags?: string // Format: "tag1, tag2, tag3"
  piece_jointe?: string
  meta_description?: string
  meta_title?: string
}

export const validateArticle = (article: Partial<CreateArticleRequest>): ArticleValidationErrors => {
  const errors: ArticleValidationErrors = {}

  if (!article.title?.trim()) {
    errors.title = 'Le titre est requis'
  } else if (article.title.length > 200) {
    errors.title = 'Le titre ne peut pas dépasser 200 caractères'
  }

  if (!article.content?.trim()) {
    errors.content = 'Le contenu est requis'
  }

  if (article.meta_description && article.meta_description.length > 160) {
    errors.meta_description = 'La meta description ne peut pas dépasser 160 caractères'
  }

  if (article.category && !isValidArticleCategory(article.category)) {
    errors.category = 'Catégorie invalide'
  }

  if (article.type && !isValidArticleType(article.type)) {
    errors.type = 'Type d\'article invalide'
  }

  if (article.seo_title && article.seo_title.length > 60) {
    errors.seo_title = 'Le titre SEO ne peut pas dépasser 60 caractères'
  }

  return errors
}