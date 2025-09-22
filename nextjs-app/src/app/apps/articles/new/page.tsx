"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import slugify from 'slugify'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { 
  CreateArticleRequest, 
  validateArticle,
  ARTICLE_CATEGORIES,
  ARTICLE_STATUSES 
} from '@/types/article'

export default function NewArticlePage() {
  const router = useRouter()
  const [loading, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [errors, setErrors] = useState<any>({})
  
  const [formData, setFormData] = useState<CreateArticleRequest>({
    title: '',
    slug: '',
    meta_description: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    category: 'general',
    tags: [],
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
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

  const renderMarkdownPreview = (content: string) => {
    // Simple rendu markdown basique (on pourrait utiliser une vraie lib markdown plus tard)
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^\s*$/, '')
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
            <h1 className="text-3xl font-bold text-gray-900">Nouvel article</h1>
            <p className="text-gray-600 mt-2">
              Créez un nouvel article pour votre blog.
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? 'Édition' : 'Aperçu'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            Brouillon
          </Button>
          
          <Button
            onClick={() => handleSave('published')}
            disabled={loading}
          >
            Publier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {!previewMode ? (
            <>
              {/* Titre */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <p className="text-gray-500 text-sm mt-1">
                      URL: /ressources/{formData.slug}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="bg-white p-6 rounded-lg shadow">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu de l'article *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Rédigez votre article en markdown..."
                  rows={20}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary font-mono ${
                    errors.content ? 'border-red-500' : ''
                  }`}
                />
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1">{errors.content}</p>
                )}
                <p className="text-gray-500 text-sm mt-2">
                  Utilisez la syntaxe Markdown pour formater votre contenu.
                </p>
              </div>
            </>
          ) : (
            /* Aperçu */
            <div className="bg-white p-6 rounded-lg shadow">
              <h1 className="text-3xl font-bold mb-4">{formData.title || 'Titre de l\'article'}</h1>
              
              {formData.excerpt && (
                <p className="text-lg text-gray-600 mb-6">{formData.excerpt}</p>
              )}
              
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: `<p class="mb-4">${renderMarkdownPreview(formData.content || 'Contenu de l\'article...')}</p>` 
                }}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Informations</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extrait
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="Résumé de l'article..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                >
                  {ARTICLE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (séparés par des virgules)
                </label>
                <Input
                  value={formData.tags?.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  placeholder="copropriété, gestion, conseil"
                />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">SEO</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="Description pour les moteurs de recherche..."
                  rows={3}
                  className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary ${
                    errors.meta_description ? 'border-red-500' : ''
                  }`}
                />
                {errors.meta_description && (
                  <p className="text-red-500 text-sm mt-1">{errors.meta_description}</p>
                )}
                <p className="text-gray-500 text-sm mt-1">
                  {formData.meta_description?.length || 0}/160 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

          {/* Image de couverture */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Image de couverture</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de l'image
              </label>
              <Input
                value={formData.featured_image_url}
                onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
                placeholder="https://exemple.com/image.jpg"
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