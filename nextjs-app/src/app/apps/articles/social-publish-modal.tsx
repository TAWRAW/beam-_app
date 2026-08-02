"use client"

import { useState, useEffect } from 'react'
import { Share2, Facebook, Linkedin, Instagram, Clock, CheckSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { ArticleWithAuthor } from '@/types/article'

const STORAGE_KEY = 'social-publish-last-platforms'

interface SocialPublishModalProps {
  article: ArticleWithAuthor
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type Platform = 'facebook' | 'linkedin' | 'instagram' | 'tiktok'

const platformIcons: Record<Platform, any> = {
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
  tiktok: Share2, // Using Share2 as placeholder for TikTok
}

const platformLabels: Record<Platform, string> = {
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  tiktok: 'TikTok',
}

export function SocialPublishModal({ article, trigger, open: controlledOpen, onOpenChange }: SocialPublishModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'queue'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const allPlatforms: Platform[] = ['facebook', 'linkedin', 'instagram', 'tiktok']

  // Load last used platforms from localStorage on mount
  useEffect(() => {
    if (open) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Platform[]
          // Only set valid platforms
          const valid = parsed.filter(p => allPlatforms.includes(p))
          if (valid.length > 0) {
            setPlatforms(valid)
          }
        }
      } catch (e) {
        console.error('Error loading platforms from localStorage:', e)
      }
    }
  }, [open])

  const togglePlatform = (platform: Platform) => {
    setPlatforms(prev => {
      const next = prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (e) {
        console.error('Error saving platforms to localStorage:', e)
      }

      return next
    })
  }

  const toggleAll = () => {
    setPlatforms(prev => {
      const next = prev.length === allPlatforms.length ? [] : allPlatforms

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch (e) {
        console.error('Error saving platforms to localStorage:', e)
      }

      return next
    })
  }

  const handleSubmit = async () => {
    if (platforms.length === 0) {
      setError('Veuillez sélectionner au moins une plateforme')
      return
    }

    if (publishMode === 'schedule' && (!scheduledDate || !scheduledTime)) {
      setError('Veuillez sélectionner une date et une heure')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload: any = {
        article_id: article.id,
        platforms,
        publish_mode: publishMode,
      }

      if (publishMode === 'schedule') {
        // Combine date and time into ISO 8601 datetime
        payload.scheduled_for = `${scheduledDate}T${scheduledTime}:00.000Z`
      }

      const response = await fetch('/api/social-publishing/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la publication')
      }

      setSuccess(true)
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        // Keep platforms selected for next time (saved in localStorage)
        setPublishMode('now')
        setScheduledDate('')
        setScheduledTime('')
        window.location.reload() // Refresh to show updated social media status
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Custom modal without Radix Dialog (which has issues with DropdownMenu)
  if (!open) return <></>

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-app-surface rounded-lg shadow-xl max-w-[500px] w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="p-6 text-center bg-app-surface">
            <div className="mx-auto w-12 h-12 rounded-full bg-app-success-bg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-app-fg">
              {publishMode === 'now' && 'Publication en cours...'}
              {publishMode === 'schedule' && 'Publication programmée !'}
              {publishMode === 'queue' && 'Ajouté à la file !'}
            </p>
            <p className="text-sm text-app-fg-muted mt-2">
              Fermeture automatique...
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-app-border bg-app-surface">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold leading-none tracking-tight text-app-fg">
                    Publier sur les réseaux sociaux
                  </h2>
                  <p className="text-sm text-app-fg-muted mt-1.5">
                    Partagez "{article.title}" sur vos réseaux sociaux
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-sm opacity-70 hover:opacity-100 transition-opacity text-app-fg"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 bg-app-surface">
            {/* Platform Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Plateformes</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleAll}
                  className="h-8 text-xs"
                >
                  <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
                  {platforms.length === allPlatforms.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {allPlatforms.map((platform) => {
                  const Icon = platformIcons[platform]
                  const isSelected = platforms.includes(platform)

                  return (
                    <div
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-app-border hover:border-app-border'
                      }`}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => togglePlatform(platform)} />
                      <Icon className="h-5 w-5 text-app-fg" />
                      <span className="text-sm font-medium">{platformLabels[platform]}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Publish Mode */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Quand publier ?</Label>
              <RadioGroup value={publishMode} onValueChange={(value: any) => setPublishMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="now" id="now" />
                  <Label htmlFor="now" className="font-normal cursor-pointer">
                    Publier maintenant
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="schedule" id="schedule" />
                  <Label htmlFor="schedule" className="font-normal cursor-pointer">
                    Programmer la publication
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="queue" id="queue" />
                  <Label htmlFor="queue" className="font-normal cursor-pointer">
                    Ajouter à la file
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Schedule DateTime */}
            {publishMode === 'schedule' && (
              <div className="space-y-3 pl-6 border-l-2 border-app-border">
                <div className="flex items-center gap-2 text-sm text-app-fg-muted">
                  <Clock className="h-4 w-4" />
                  <span>Choisissez la date et l&apos;heure</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date" className="text-xs text-app-fg-muted">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-xs text-app-fg-muted">Heure</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-app-danger-bg border border-app-danger-fg/30">
                <p className="text-sm text-app-danger-fg">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || platforms.length === 0}
              >
                {loading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    {publishMode === 'now' && 'Publier'}
                    {publishMode === 'schedule' && 'Programmer'}
                    {publishMode === 'queue' && 'Ajouter à la file'}
                  </>
                )}
              </Button>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  )
}
