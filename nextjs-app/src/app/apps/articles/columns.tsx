"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArticleWithAuthor, ARTICLE_STATUSES, ARTICLE_CATEGORIES } from "@/types/article"

const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800'
}

const categoryColors = {
  general: 'bg-blue-100 text-blue-800',
  guides: 'bg-purple-100 text-purple-800',
  actualites: 'bg-red-100 text-red-800',
  conseils: 'bg-green-100 text-green-800',
  reglementation: 'bg-orange-100 text-orange-800',
  immobilier: 'bg-indigo-100 text-indigo-800'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const columns: ColumnDef<ArticleWithAuthor>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Titre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const article = row.original
      return (
        <div className="max-w-md">
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-900 truncate">
              {article.title}
            </div>
            {article.import_source === 'notion' && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Notion
              </span>
            )}
          </div>
          {article.excerpt && (
            <div className="text-sm text-gray-500 truncate mt-1">
              {article.excerpt}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            /{article.slug}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.original.status
      const statusLabel = ARTICLE_STATUSES.find(s => s.value === status)?.label || status
      
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}>
          {statusLabel}
        </span>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Catégorie",
    cell: ({ row }) => {
      const category = row.original.category
      const categoryLabel = ARTICLE_CATEGORIES.find(c => c.value === category)?.label || category
      
      return (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${categoryColors[category]}`}>
          {categoryLabel}
        </span>
      )
    },
  },
  {
    accessorKey: "author",
    header: "Auteur",
    cell: ({ row }) => {
      const author = row.original.author
      return (
        <div className="text-sm">
          {author?.full_name || author?.email || 'Inconnu'}
        </div>
      )
    },
  },
  {
    accessorKey: "views_count",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          <Eye className="mr-2 h-4 w-4" />
          Vues
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const views = row.original.views_count
      return (
        <div className="text-center">
          {views.toLocaleString('fr-FR')}
        </div>
      )
    },
  },
  {
    accessorKey: "reading_time_minutes",
    header: "Lecture",
    cell: ({ row }) => {
      const time = row.original.reading_time_minutes
      return (
        <div className="text-sm text-gray-600">
          {time} min
        </div>
      )
    },
  },
  {
    accessorKey: "published_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Publication
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const publishedAt = row.original.published_at
      if (!publishedAt) {
        return <span className="text-gray-400">Non publié</span>
      }
      return (
        <div className="text-sm text-gray-600">
          {formatDate(publishedAt)}
        </div>
      )
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Modifié
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const updatedAt = row.original.updated_at
      return (
        <div className="text-sm text-gray-600">
          {formatDate(updatedAt)}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const article = row.original

      const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
          return
        }

        try {
          const response = await fetch(`/api/articles/${article.id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Erreur lors de la suppression')
          }

          // Refresh the page to show updated data
          window.location.reload()
        } catch (error) {
          console.error('Error deleting article:', error)
          alert('Erreur lors de la suppression de l\'article')
        }
      }

      const handleStatusChange = async (newStatus: string) => {
        try {
          const response = await fetch(`/api/articles/${article.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              id: article.id,
              status: newStatus 
            }),
          })

          if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour')
          }

          // Refresh the page to show updated data
          window.location.reload()
        } catch (error) {
          console.error('Error updating article status:', error)
          alert('Erreur lors de la mise à jour du statut')
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            
            <DropdownMenuItem asChild>
              <Link href={`/apps/articles/${article.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </DropdownMenuItem>

            {article.status === 'published' && (
              <DropdownMenuItem asChild>
                <Link href={`/ressources/${article.slug}`} target="_blank">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Voir sur le site
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            
            <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
            
            {article.status !== 'published' && (
              <DropdownMenuItem onClick={() => handleStatusChange('published')}>
                Publier
              </DropdownMenuItem>
            )}
            
            {article.status !== 'draft' && (
              <DropdownMenuItem onClick={() => handleStatusChange('draft')}>
                Mettre en brouillon
              </DropdownMenuItem>
            )}
            
            {article.status !== 'archived' && (
              <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
                Archiver
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]