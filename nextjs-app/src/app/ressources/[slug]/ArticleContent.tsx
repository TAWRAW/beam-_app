"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Eye, User, Share2, Facebook, Linkedin, Mail } from 'lucide-react'
import { ArticleWithAuthor } from '@/types/article'
import { MarkdownPreview } from '@/components/ui/MarkdownPreview'
import { ImageModal } from '@/components/ui/ImageModal'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

interface ArticleContentProps {
  article: ArticleWithAuthor
  effectiveFeaturedImage: string | null
  formattedDate: string
}

export function ArticleContent({ article, effectiveFeaturedImage, formattedDate }: ArticleContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // URL de l'article pour le partage
  const articleUrl = `https://www.xn--beam-yqa.fr/ressources/${article.slug}`
  const shareTitle = encodeURIComponent(article.title)
  const shareText = encodeURIComponent(article.meta_description || article.title)

  // Fonctions de partage
  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${articleUrl}`, '_blank')
  }

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${articleUrl}&title=${shareTitle}`, '_blank')
  }

  const shareByEmail = () => {
    window.location.href = `mailto:?subject=${shareTitle}&body=${shareText}%0A%0A${articleUrl}`
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl)
      alert('Lien copié dans le presse-papiers !')
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  // Schema.org JSON-LD pour SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.meta_description || article.title,
    image: effectiveFeaturedImage || undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': 'Person',
      name: article.author?.full_name || 'Beamô',
      url: 'https://www.xn--beam-yqa.fr/qui-sommes-nous'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Beamô',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.xn--beam-yqa.fr/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.xn--beam-yqa.fr/ressources/${article.slug}`
    },
    keywords: article.tags?.join(', ') || undefined,
    articleSection: article.category || 'Copropriété',
    wordCount: article.content?.split(/\s+/).length || undefined,
    timeRequired: `PT${article.reading_time_minutes}M`
  }

  // Breadcrumb Schema
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: 'https://www.xn--beam-yqa.fr'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Ressources',
        item: 'https://www.xn--beam-yqa.fr/ressources'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: `https://www.xn--beam-yqa.fr/ressources/${article.slug}`
      }
    ]
  }

  return (
    <main className="section">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <div className="container max-w-4xl">
        {/* Fil d'Ariane */}
        <Breadcrumb
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Ressources', href: '/ressources' },
            { label: article.title }
          ]}
        />

        {/* Navigation */}
        <div className="mb-8">
          <Link
            href="/ressources"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux ressources
          </Link>
        </div>

        {/* Header de l'article */}
        <header className="mb-8">
          {/* Image de couverture */}
          {effectiveFeaturedImage && (
            <div className="cursor-pointer" onClick={() => setIsModalOpen(true)}>
              <img
                src={effectiveFeaturedImage}
                alt={article.title}
                className="w-full h-64 md:h-80 object-cover rounded-lg mb-8 hover:opacity-95 transition-opacity"
                title="Cliquez pour agrandir l'image"
              />
            </div>
          )}

          {/* Catégorie et métadonnées */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 w-fit">
              {article.category}
            </span>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="whitespace-nowrap">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span className="whitespace-nowrap">{article.reading_time_minutes} min de lecture</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span className="whitespace-nowrap">{article.views_count + 1} vues</span>
              </div>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
            {article.title}
          </h1>

          {/* Auteur */}
          {article.author && (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              {article.author.avatar_url ? (
                <img
                  src={article.author.avatar_url}
                  alt={article.author.full_name || 'Auteur'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">
                  {article.author.full_name || 'Auteur anonyme'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Article publié le {formattedDate}
                </p>
              </div>
            </div>
          )}
        </header>

        {/* Contenu de l'article */}
        <article className="max-w-none">
          <MarkdownPreview content={article.content} />
        </article>

        {/* Boutons de partage social */}
        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Partager cet article
          </h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={shareOnFacebook}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </button>
            <button
              onClick={shareOnLinkedIn}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </button>
            <button
              onClick={shareByEmail}
              className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Copier le lien
            </button>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border">
            <h3 className="text-lg font-semibold mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent text-muted-foreground hover:bg-muted transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Call-to-Action vers services */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="bg-muted rounded-lg p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
              Besoin d'un syndic de confiance ?
            </h3>
            <p className="text-muted-foreground mb-6">
              Beamô vous accompagne dans la gestion de votre copropriété avec transparence et réactivité.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/offres"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Découvrir nos offres
              </Link>
              <Link
                href="/ressources/contact"
                className="inline-flex items-center px-6 py-3 bg-background text-foreground border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation vers d'autres articles */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="text-center">
            <Link
              href="/ressources"
              className="inline-flex items-center px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Découvrir d'autres articles
            </Link>
          </div>
        </div>
      </div>

      {/* Modal pour affichage en grand */}
      {effectiveFeaturedImage && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          src={effectiveFeaturedImage}
          alt={article.title}
        />
      )}
    </main>
  )
}