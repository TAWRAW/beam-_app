"use client"

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Eye, User } from 'lucide-react'
import { ArticleWithAuthor } from '@/types/article'
import { MarkdownPreview } from '@/components/ui/MarkdownPreview'
import { ImageModal } from '@/components/ui/ImageModal'

interface ArticleContentProps {
  article: ArticleWithAuthor
  effectiveFeaturedImage: string | null
  formattedDate: string
}

export function ArticleContent({ article, effectiveFeaturedImage, formattedDate }: ArticleContentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <main className="section">
      <div className="container max-w-4xl">
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

        {/* Navigation vers d'autres articles */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="text-center">
            <Link
              href="/ressources"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
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