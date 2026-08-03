/**
 * CRÉATION D'ARTICLES - Interface d'édition
 *
 * Interface complète pour créer de nouveaux articles dans le CMS Beamô.
 * Éditeur markdown avec prévisualisation et gestion des métadonnées SEO.
 *
 * FONCTIONNALITÉS:
 * - Éditeur markdown avec modes: édition, préview, split
 * - Auto-génération de slug à partir du titre
 * - Upload d'images avec intégration automatique
 * - Gestion des catégories et types d'articles
 * - Validation des données avant sauvegarde
 * - Sauvegarde en brouillon ou publication directe
 * - Métadonnées SEO complètes
 *
 * WORKFLOW:
 * 1. Saisie titre → génération automatique du slug
 * 2. Rédaction contenu en markdown
 * 3. Configuration métadonnées (SEO, catégorie, tags)
 * 4. Upload images optionnel
 * 5. Sauvegarde (draft/published) → redirection vers édition
 *
 * MAINTENANCE:
 * - Types d'articles dans /types/article.ts
 * - API de création dans /api/articles/route.ts
 * - Validation avec validateArticle()
 * - Upload images via ImageUpload component
 */

"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import slugify from 'slugify'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MarkdownPreview } from '@/components/ui/MarkdownPreview'
import { ImageUpload } from '@/components/ui/ImageUpload'
import {
  CreateArticleRequest,
  validateArticle,
  ArticleValidationErrors,
  ARTICLE_CATEGORIES,
  ARTICLE_TYPES,
  ARTICLE_STATUSES
} from '@/types/article'

export default function NewArticlePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const [errors, setErrors] = useState<ArticleValidationErrors>({})
  const [shakeButtons, setShakeButtons] = useState(false)
  
  const [formData, setFormData] = useState<CreateArticleRequest>({
    title: '',
    slug: '',
    meta_description: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    category: 'general',
    type: 'articles',
    tags: [],
    attachment_url: '',
    status: 'draft',
    seo_title: '',
    seo_keywords: ''
  })

  const handleInputChange = (field: keyof CreateArticleRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-générer le slug si le titre change
    if (field === 'title' && typeof value === 'string') {
      const autoSlug = slugify(value, {
        lower: true,
        strict: true,
        locale: 'fr'
      })
      setFormData(prev => ({ ...prev, slug: autoSlug }))
    }
    
    // Effacer l'erreur du champ modifié
    if (field in errors && errors[field as keyof ArticleValidationErrors]) {
      setErrors(prev => ({ ...prev, [field as keyof ArticleValidationErrors]: undefined }))
    }
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    setFormData(prev => ({ ...prev, tags }))
  }

  const handleSave = async (status: 'draft' | 'published' = 'draft') => {
    setSaving(true)
    setErrors({})

    const articleData = { ...formData, status }
    const validationErrors = validateArticle(articleData)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setSaving(false)

      // Animation de secousse pour indiquer le refus
      setShakeButtons(true)
      setTimeout(() => setShakeButtons(false), 500)

      return
    }

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          setErrors(result.details)
        } else {
          throw new Error(result.error || 'Erreur lors de la création')
        }
        return
      }

      // Rediriger vers la page d'édition de l'article créé
      router.push(`/apps/articles/${result.article.id}/edit?success=created`)
    } catch (error) {
      console.error('Error creating article:', error)
      alert('Erreur lors de la création de l\'article')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/apps/articles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-app-fg">Nouvel article</h1>
            <p className="text-app-fg-muted mt-2">
              Créez un nouvel article pour votre blog.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-app-border p-1">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1.5 text-sm rounded ${
                viewMode === 'edit' ? 'bg-primary text-white' : 'text-app-fg-muted hover:text-app-fg'
              }`}
            >
              Édition
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-sm rounded ${
                viewMode === 'split' ? 'bg-primary text-white' : 'text-app-fg-muted hover:text-app-fg'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1.5 text-sm rounded ${
                viewMode === 'preview' ? 'bg-primary text-white' : 'text-app-fg-muted hover:text-app-fg'
              }`}
            >
              Aperçu
            </button>
          </div>

          <div className={`flex gap-2 ${shakeButtons ? 'animate-shake' : ''}`}>
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              Brouillon
            </Button>

            <Button
              onClick={() => handleSave('published')}
              disabled={saving}
            >
              Publier
            </Button>
          </div>
        </div>
      </div>

      {/* Layout flexible basé sur le mode */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Zone d'édition */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`space-y-6 ${viewMode === 'split' ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
            {/* Titre */}
            <div className="bg-app-surface p-6 rounded-lg shadow">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-app-fg mb-2">
                    Titre de l'article *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Entrez le titre de votre article..."
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-app-fg mb-2">
                    Slug (URL)
                  </label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="slug-de-larticle"
                    className={errors.slug ? 'border-red-500' : ''}
                  />
                  {errors.slug && (
                    <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
                  )}
                  <p className="text-app-fg-muted text-sm mt-1">
                    URL: /ressources/{formData.slug}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="bg-app-surface p-6 rounded-lg shadow">
              <label className="block text-sm font-medium text-app-fg mb-2">
                Contenu de l'article *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Rédigez votre article en markdown..."
                rows={viewMode === 'split' ? 25 : 20}
                className={`w-full border border-app-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary font-mono resize-none ${
                  errors.content ? 'border-red-500' : ''
                }`}
              />
              {errors.content && (
                <p className="text-red-500 text-sm mt-1">{errors.content}</p>
              )}
              <p className="text-app-fg-muted text-sm mt-2">
                Utilisez la syntaxe Markdown pour formater votre contenu.
              </p>
            </div>
          </div>
        )}

        {/* Zone de prévisualisation */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'lg:col-span-2' : 'lg:col-span-2'}`}>
            <div className="bg-app-surface p-6 rounded-lg shadow">
              <div className="mb-6 border-b border-app-border pb-4">
                <h1 className="text-3xl font-bold text-app-fg">
                  {formData.title || 'Titre de l\'article'}
                </h1>
                <div className="flex items-center gap-4 mt-3 text-sm text-app-fg-muted">
                  <span>Catégorie: {ARTICLE_CATEGORIES.find(c => c.value === formData.category)?.label}</span>
                  <span>Type: {ARTICLE_TYPES.find(t => t.value === formData.type)?.label}</span>
                </div>
                {formData.excerpt && (
                  <div className="mt-3 p-3 bg-app-info-bg border-l-4 border-app-info-fg/30 rounded">
                    <p className="text-sm text-app-info-fg">
                      <strong>Extrait (affiché sur les listes d'articles) :</strong>
                    </p>
                    <p className="text-app-info-fg mt-1">{formData.excerpt}</p>
                  </div>
                )}
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: viewMode === 'split' ? '600px' : 'none' }}>
                <MarkdownPreview content={formData.content} />
              </div>
            </div>
          </div>
        )}
        {/* Sidebar */}
        <div className={`space-y-6 ${viewMode === 'split' ? 'lg:col-span-1' : 'lg:col-span-1'}`}>
          {/* Informations générales */}
          <div className="bg-app-surface p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Informations</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-fg mb-2">
                  Extrait
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="Résumé de l'article..."
                  rows={3}
                  className="w-full border border-app-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app-fg mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full border border-app-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                >
                  {ARTICLE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-fg mb-2">
                  Type de contenu
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full border border-app-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                >
                  {ARTICLE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-fg mb-2">
                  Tags (séparés par des virgules)
                </label>
                <Input
                  value={formData.tags?.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="copropriété, gestion, conseil"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-app-fg mb-2">
                  Pièce jointe (optionnel)
                </label>
                <Input
                  value={formData.attachment_url}
                  onChange={(e) => handleInputChange('attachment_url', e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="text-app-fg-muted text-sm mt-1">
                  Ajoutez un lien vers un fichier Google Drive pour les modèles et documents
                </p>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-app-surface p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-app-fg mb-2">
                  Titre SEO
                </label>
                <Input
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  placeholder="Titre pour les moteurs de recherche"
                  className={errors.seo_title ? 'border-red-500' : ''}
                />
                {errors.seo_title && (
                  <p className="text-red-500 text-sm mt-1">{errors.seo_title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-app-fg mb-2">
                  Meta description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="Description pour les moteurs de recherche..."
                  rows={3}
                  className={`w-full border border-app-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary ${
                    errors.meta_description ? 'border-red-500' : ''
                  }`}
                />
                {errors.meta_description && (
                  <p className="text-red-500 text-sm mt-1">{errors.meta_description}</p>
                )}
                <p className="text-app-fg-muted text-sm mt-1">
                  {formData.meta_description?.length || 0}/160 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-app-fg mb-2">
                  Mots-clés SEO
                </label>
                <Input
                  value={formData.seo_keywords}
                  onChange={(e) => handleInputChange('seo_keywords', e.target.value)}
                  placeholder="mot-clé, autre mot-clé"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-app-surface p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Images</h3>

            {/* Upload d'images pour le contenu */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-app-fg mb-2">Upload d'images</h4>
              <ImageUpload
                onImageUploaded={(url) => {
                  // Ajouter automatiquement l'image au contenu
                  const imageMarkdown = `![Image](${url})`
                  setFormData(prev => ({
                    ...prev,
                    content: prev.content + '\n\n' + imageMarkdown + '\n\n'
                  }))
                  // Copier aussi dans le presse-papier
                  navigator.clipboard.writeText(imageMarkdown)
                }}
              />
              <p className="text-xs text-app-fg-muted mt-2">
                Les images uploadées sont ajoutées automatiquement au contenu de l'article
              </p>
            </div>

            {/* Image de couverture */}
            <div>
              <label className="block text-sm font-medium text-app-fg mb-2">
                Image de couverture (URL)
              </label>
              <Input
                value={formData.featured_image_url}
                onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
                placeholder="https://exemple.com/image.jpg ou /uploads/image.jpg"
              />
              {formData.featured_image_url && (
                <div className="mt-2">
                  <img
                    src={formData.featured_image_url}
                    alt="Aperçu"
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}