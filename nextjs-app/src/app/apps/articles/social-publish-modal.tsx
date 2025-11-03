"use client"

import { useState } from 'react'
import { Share2, Facebook, Linkedin, Instagram, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { ArticleWithAuthor } from '@/types/article'

interface SocialPublishModalProps {
  article: ArticleWithAuthor
  trigger?: React.ReactNode
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

export function SocialPublishModal({ article, trigger }: SocialPublishModalProps) {
  const [open, setOpen] = useState(false)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const allPlatforms: Platform[] = ['facebook', 'linkedin', 'instagram', 'tiktok']

  const togglePlatform = (platform: Platform) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
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
        setPlatforms([])
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Publier sur les réseaux
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Publier sur les réseaux sociaux</DialogTitle>
          <DialogDescription>
            Partagez &quot;{article.title}&quot; sur vos réseaux sociaux
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">
              {publishMode === 'now' ? 'Publication en cours...' : 'Publication programmée !'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Fermeture automatique...
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Platform Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Plateformes</Label>
              <div className="grid grid-cols-2 gap-3">
                {allPlatforms.map((platform) => {
                  const Icon = platformIcons[platform]
                  const isSelected = platforms.includes(platform)

                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Checkbox checked={isSelected} />
                      <Icon className="h-5 w-5 text-gray-700" />
                      <span className="text-sm font-medium">{platformLabels[platform]}</span>
                    </button>
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
              </RadioGroup>
            </div>

            {/* Schedule DateTime */}
            {publishMode === 'schedule' && (
              <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Choisissez la date et l&apos;heure</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date" className="text-xs text-gray-600">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-xs text-gray-600">Heure</Label>
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
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
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
                    {publishMode === 'now' ? 'Publier' : 'Programmer'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
