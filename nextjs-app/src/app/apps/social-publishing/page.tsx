"use client"

import { useEffect, useState } from 'react'
import { Facebook, Linkedin, Instagram, Share2, Clock, CheckCircle, XCircle, Calendar, Settings } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

type Platform = 'facebook' | 'linkedin' | 'instagram' | 'tiktok'

type SocialPublication = {
  id: string
  article_id: string
  article_title: string
  article_slug: string
  platform: Platform
  scheduled_for?: string
  published_at?: string
  status: 'pending' | 'published' | 'failed'
  error_message?: string
}

const platformIcons: Record<Platform, any> = {
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
  tiktok: Share2,
}

const platformColors: Record<Platform, string> = {
  facebook: 'bg-app-info-bg text-app-info-fg',
  linkedin: 'bg-app-info-bg text-app-info-fg',
  instagram: 'bg-pink-100 text-pink-800',
  tiktok: 'bg-app-surface-2 text-app-fg',
}

const statusColors = {
  pending: 'bg-app-warning-bg text-app-warning-fg',
  published: 'bg-app-success-bg text-app-success-fg',
  failed: 'bg-app-danger-bg text-app-danger-fg',
}

const statusLabels = {
  pending: 'En attente',
  published: 'Publié',
  failed: 'Échec',
}

export default function SocialPublishingPage() {
  const [publications, setPublications] = useState<SocialPublication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'published' | 'failed'>('all')
  const [queueTime, setQueueTime] = useState('09:00')
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    loadPublications()
    // Load queue time from localStorage
    const savedTime = localStorage.getItem('social-queue-time')
    if (savedTime) {
      setQueueTime(savedTime)
    }
  }, [])

  const loadPublications = async () => {
    try {
      // TODO: Créer l'API pour récupérer les publications
      // const response = await fetch('/api/social-publishing/list')
      // const data = await response.json()
      // setPublications(data.publications)

      // Mock data pour l'instant
      setPublications([])
    } catch (error) {
      console.error('Error loading publications:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveQueueSettings = async () => {
    setSavingSettings(true)
    try {
      // TODO: Créer l'API pour sauvegarder les paramètres
      // const response = await fetch('/api/social-publishing/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ queue_time: queueTime })
      // })

      // For now, just save to localStorage
      localStorage.setItem('social-queue-time', queueTime)
      alert('Paramètres enregistrés !')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Erreur lors de l\'enregistrement')
    } finally {
      setSavingSettings(false)
    }
  }

  const filteredPublications = publications.filter(pub => {
    if (filter === 'all') return true
    return pub.status === filter
  })

  const stats = {
    total: publications.length,
    pending: publications.filter(p => p.status === 'pending').length,
    published: publications.filter(p => p.status === 'published').length,
    failed: publications.filter(p => p.status === 'failed').length,
  }

  if (loading) {
    return (
      <div className="py-10">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-app-fg">Réseaux sociaux</h1>
        <p className="text-app-fg-muted mt-2">
          Gérez vos publications sur les réseaux sociaux
        </p>
      </div>

      {/* Queue Settings */}
      <div className="bg-app-surface p-6 rounded-lg shadow mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-5 w-5 text-app-fg" />
          <h2 className="text-lg font-semibold text-app-fg">Paramètres de la file d'attente</h2>
        </div>
        <p className="text-sm text-app-fg-muted mb-4">
          Définissez l'heure à laquelle les articles en file d'attente seront automatiquement publiés chaque jour.
        </p>

        <div className="flex items-end gap-4 max-w-md">
          <div className="flex-1">
            <Label htmlFor="queue-time" className="text-sm font-medium text-app-fg mb-2 block">
              Heure de publication quotidienne
            </Label>
            <Input
              id="queue-time"
              type="time"
              value={queueTime}
              onChange={(e) => setQueueTime(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            onClick={saveQueueSettings}
            disabled={savingSettings}
          >
            {savingSettings ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-app-info-bg border border-app-info-fg/30 rounded-lg">
          <p className="text-sm text-app-info-fg">
            <Clock className="h-4 w-4 inline mr-1" />
            Les articles ajoutés à la file seront publiés automatiquement chaque jour à {queueTime}.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-app-surface p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-app-fg-muted">Total</p>
              <p className="text-2xl font-bold text-app-fg">{stats.total}</p>
            </div>
            <Share2 className="h-8 w-8 text-app-fg-faint" />
          </div>
        </div>

        <div className="bg-app-surface p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-app-fg-muted">En attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-app-surface p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-app-fg-muted">Publiés</p>
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-app-surface p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-app-fg-muted">Échecs</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-app-surface rounded-lg shadow mb-6">
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Toutes ({stats.total})
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              En attente ({stats.pending})
            </Button>
            <Button
              variant={filter === 'published' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('published')}
            >
              Publiées ({stats.published})
            </Button>
            <Button
              variant={filter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('failed')}
            >
              Échecs ({stats.failed})
            </Button>
          </div>
        </div>

        {/* Publications list */}
        <div className="p-4">
          {filteredPublications.length === 0 ? (
            <div className="text-center py-12">
              <Share2 className="h-12 w-12 text-app-fg-faint mx-auto mb-4" />
              <h3 className="text-lg font-medium text-app-fg mb-2">
                Aucune publication
              </h3>
              <p className="text-app-fg-muted mb-4">
                {filter === 'all'
                  ? "Vous n'avez pas encore publié d'articles sur les réseaux sociaux."
                  : `Aucune publication avec le statut "${statusLabels[filter as keyof typeof statusLabels]}".`}
              </p>
              <Link href="/apps/articles">
                <Button>
                  Voir les articles
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPublications.map((pub) => {
                const Icon = platformIcons[pub.platform]

                return (
                  <div
                    key={pub.id}
                    className="border rounded-lg p-4 hover:bg-app-surface-2 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${platformColors[pub.platform]}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {pub.platform.charAt(0).toUpperCase() + pub.platform.slice(1)}
                          </div>

                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[pub.status]}`}>
                            {statusLabels[pub.status]}
                          </span>

                          {pub.scheduled_for && pub.status === 'pending' && (
                            <span className="flex items-center gap-1 text-xs text-app-fg-muted">
                              <Calendar className="h-3 w-3" />
                              {new Date(pub.scheduled_for).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}

                          {pub.published_at && pub.status === 'published' && (
                            <span className="flex items-center gap-1 text-xs text-app-fg-muted">
                              <CheckCircle className="h-3 w-3" />
                              {new Date(pub.published_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/apps/articles/${pub.article_id}/edit`}
                          className="font-medium text-app-fg hover:text-primary"
                        >
                          {pub.article_title}
                        </Link>

                        {pub.error_message && (
                          <p className="text-sm text-red-600 mt-2">
                            {pub.error_message}
                          </p>
                        )}
                      </div>

                      <Link href={`/ressources/${pub.article_slug}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          Voir l'article
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
