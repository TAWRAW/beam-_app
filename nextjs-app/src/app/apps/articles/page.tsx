"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Eye, Users, TrendingUp } from 'lucide-react'

import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { columns } from './columns'
import { 
  ArticleWithAuthor, 
  ArticleListResponse, 
  ArticleStats,
  ArticleFilters,
  ARTICLE_STATUSES,
  ARTICLE_CATEGORIES 
} from '@/types/article'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([])
  const [stats, setStats] = useState<ArticleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [filters, setFilters] = useState<ArticleFilters>({
    status: 'all',
    category: 'all'
  })

  const loadArticles = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filters.status && filters.status !== 'all') {
        params.set('status', filters.status)
      }
      
      if (filters.category && filters.category !== 'all') {
        params.set('category', filters.category)
      }

      params.set('sort_field', 'updated_at')
      params.set('sort_direction', 'desc')
      params.set('limit', '50')

      const response = await fetch(`/api/articles?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to load articles')
      }
      
      const data: ArticleListResponse = await response.json()
      setArticles(data.articles)
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch('/api/articles/stats')
      if (!response.ok) {
        throw new Error('Failed to load stats')
      }
      
      const data: ArticleStats = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [filters])

  useEffect(() => {
    loadStats()
  }, [])

  if (loading && !articles.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des articles</h1>
          <p className="text-gray-600 mt-2">
            Créez, modifiez et gérez vos articles de blog et ressources.
          </p>
        </div>
        <Link href="/apps/articles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel article
          </Button>
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total articles</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : stats?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Publiés</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : stats?.published || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Brouillons</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : stats?.drafts || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total vues</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : (stats?.totalViews || 0).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="all">Tous les statuts</option>
              {ARTICLE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => setFilters({ ...filters, category: e.target.value as any })}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="all">Toutes les catégories</option>
              {ARTICLE_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {(filters.status !== 'all' || filters.category !== 'all') && (
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ status: 'all', category: 'all' })}
              >
                Réinitialiser
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table des articles */}
      <div className="bg-white rounded-lg shadow">
        <DataTable 
          columns={columns} 
          data={articles} 
          filterColumn="title"
          filterPlaceholder="Filtrer les articles par titre..."
        />
      </div>

      {/* Tags populaires */}
      {stats?.popularTags && stats.popularTags.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold mb-4">Tags populaires</h3>
          <div className="flex flex-wrap gap-2">
            {stats.popularTags.slice(0, 10).map((tag) => (
              <span
                key={tag.tag}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
              >
                {tag.tag}
                <span className="ml-2 text-xs text-gray-500">({tag.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}