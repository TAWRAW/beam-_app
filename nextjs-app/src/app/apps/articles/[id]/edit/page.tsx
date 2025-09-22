"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Eye, ExternalLink } from 'lucide-react'
import slugify from 'slugify'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/input'
import { 
  ArticleWithAuthor,
  UpdateArticleRequest, 
  validateArticle,
  ArticleValidationErrors,
  ARTICLE_CATEGORIES,
  ARTICLE_STATUSES 
} from '@/types/article'

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [errors, setErrors] = useState<ArticleValidationErrors>({})
  const [article, setArticle] = useState<ArticleWithAuthor | null>(null)
  
  const [formData, setFormData] = useState<UpdateArticleRequest>({
    id: params.id,
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

  useEffect(() => {
    loadArticle()
  }, [params.id])

  useEffect(() => {
    // Afficher un message de succès si on vient de créer l'article
    if (searchParams.get('success') === 'created') {
      // Vous pourriez ajouter une notification toast ici
      console.log('Article créé avec succès!')
    }
  }, [searchParams])

  const loadArticle = async () => {
    try {
      const response = await fetch(`/api/articles/${params.id}`)
      if (!response.ok) {
        throw new Error('Article non trouvé')
      }
      
      const data = await response.json()
      const articleData = data.article
      
      setArticle(articleData)
      setFormData({
        id: articleData.id,
        title: articleData.title,
        slug: articleData.slug,
        meta_description: articleData.meta_description || '',
        content: articleData.content,
        excerpt: articleData.excerpt || '',
        featured_image_url: articleData.featured_image_url || '',
        category: articleData.category,
        tags: articleData.tags || [],
        status: articleData.status,
        seo_title: articleData.seo_title || '',
        seo_keywords: articleData.seo_keywords || ''
      })
    } catch (error) {
      console.error('Error loading article:', error)
      router.push('/apps/articles')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof UpdateArticleRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-générer le slug si le titre change
    if (field === 'title' && typeof value === 'string' && article) {
      const autoSlug = slugify(value, {
        lower: true,
        strict: true,
        locale: 'fr'
      })
      // Ne mettre à jour le slug que s'il n'a pas été modifié manuellement
      if (formData.slug === article.slug) {
        setFormData(prev => ({ ...prev, slug: autoSlug }))
      }
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

  const handleSave = async (newStatus?: 'draft' | 'published' | 'archived') => {
    setSaving(true)
    setErrors({})

    const updateData = { ...formData }
    if (newStatus) {
      updateData.status = newStatus
    }

    const validationErrors = validateArticle(updateData)
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/articles/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.details) {
          setErrors(result.details)
        } else {
          throw new Error(result.error || 'Erreur lors de la mise à jour')
        }
        return
      }

      // Mettre à jour l'état local
      setArticle(result.article)
      setFormData(prev => ({ ...prev, status: result.article.status }))
      
      // Afficher un message de succès
      alert('Article mis à jour avec succès!')
    } catch (error) {
      console.error('Error updating article:', error)
      alert('Erreur lors de la mise à jour de l\'article')
    } finally {
      setSaving(false)
    }
  }

  const renderMarkdownPreview = (content: string) => {
    // Simple rendu markdown basique
    return content
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^\s*$/, '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article non trouvé</h1>
          <Link href="/apps/articles">
            <Button>Retour aux articles</Button>
          </Link>
        </div>
      </div>
    )
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
            <h1 className="text-3xl font-bold text-gray-900">Modifier l'article</h1>
            <p className="text-gray-600 mt-2">
              {article.title}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {article.status === 'published' && (
            <Link href={`/ressources/${article.slug}`} target="_blank">
              <Button variant="outline">
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir
              </Button>
            </Link>
          )}
          
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? 'Édition' : 'Aperçu'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => handleSave()}
            disabled={saving}
          >
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder
          </Button>
          
          {formData.status === 'draft' && (
            <Button
              onClick={() => handleSave('published')}
              disabled={saving}
            >
              Publier
            </Button>
          )}
          
          {formData.status === 'published' && (
            <Button
              variant="outline"
              onClick={() => handleSave('draft')}
              disabled={saving}
            >
              Dépublier
            </Button>
          )}
        </div>
      </div>

      {/* Statut de l'article */}
      <div className="mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Statut actuel:</span>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              formData.status === 'published' ? 'bg-green-100 text-green-800' :
              formData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ARTICLE_STATUSES.find(s => s.value === formData.status)?.label}
            </span>
            
            {article.published_at && (
              <span className="text-sm text-gray-500">
                Publié le {new Date(article.published_at).toLocaleDateString('fr-FR')}
              </span>
            )}
            
            <span className="text-sm text-gray-500">
              {article.views_count} vues • {article.reading_time_minutes} min de lecture
            </span>
          </div>
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