// Types pour la publication automatique sur les réseaux sociaux
// Date: 20 octobre 2025

export type SocialPlatform = 'facebook' | 'linkedin'

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

// Configuration d'horaires pour un jour spécifique
export interface DaySchedule {
  enabled: boolean          // Activer la publication ce jour-là
  hours: string[]          // Liste d'heures au format HH:MM (ex: ["09:00", "14:00", "18:00"])
}

// Configuration complète du planning de publication
export interface PublishingSchedule {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

// Préférences de publication pour un utilisateur
export interface SocialPublishingPreferences {
  enabled: boolean                        // Activer/désactiver complètement
  use_unified_hours: boolean              // Si true, utilise unified_hours pour tous les jours actifs
  unified_hours: string[]                 // Heures appliquées à tous les jours si use_unified_hours = true
  schedule: PublishingSchedule            // Planning détaillé par jour
}

// Structure complète des métadonnées utilisateur (extension du Profile.metadata existant)
export interface UserMetadata {
  social_publishing_preferences?: SocialPublishingPreferences
  // ... autres métadonnées utilisateur
}

// Réponse API pour les articles en attente de publication
export interface PendingArticle {
  id: string
  title: string
  slug: string
  excerpt?: string
  featured_image_url?: string
  published_at: string
  published_on_facebook?: string
  published_on_linkedin?: string
}

// Requête pour récupérer les articles en attente
export interface GetPendingArticlesRequest {
  platform: SocialPlatform | 'all'        // Filtrer par plateforme
  limit?: number                          // Nombre maximum d'articles à retourner (default: 10)
}

// Réponse API pour les articles en attente
export interface GetPendingArticlesResponse {
  articles: PendingArticle[]
  count: number
  platform: SocialPlatform | 'all'
}

// Requête pour marquer un article comme publié
export interface MarkPublishedRequest {
  article_id: string
  platform: SocialPlatform
}

// Réponse après marquage de publication
export interface MarkPublishedResponse {
  success: boolean
  article_id: string
  platform: SocialPlatform
  published_at: string
  message?: string
}

// Statut de publication d'un article
export interface ArticleSocialStatus {
  facebook: {
    published: boolean
    published_at?: string
  }
  linkedin: {
    published: boolean
    published_at?: string
  }
}

// Constantes utiles
export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' }
]

export const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' }
]

// Heures disponibles pour la publication (par tranche de 30 min de 6h à 22h)
export const AVAILABLE_HOURS: string[] = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00'
]

// Helper: Créer un planning vide par défaut
export const getDefaultSchedule = (): PublishingSchedule => ({
  monday: { enabled: false, hours: [] },
  tuesday: { enabled: false, hours: [] },
  wednesday: { enabled: false, hours: [] },
  thursday: { enabled: false, hours: [] },
  friday: { enabled: false, hours: [] },
  saturday: { enabled: false, hours: [] },
  sunday: { enabled: false, hours: [] }
})

// Helper: Créer des préférences par défaut
export const getDefaultPreferences = (): SocialPublishingPreferences => ({
  enabled: false,
  use_unified_hours: true,
  unified_hours: ['09:00'],
  schedule: getDefaultSchedule()
})

// Helper: Valider un format d'heure HH:MM
export const isValidHourFormat = (hour: string): boolean => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/
  return regex.test(hour)
}

// Helper: Vérifier si un jour a des heures configurées
export const hasDayConfiguredHours = (day: DaySchedule, useUnifiedHours: boolean, unifiedHours: string[]): boolean => {
  if (!day.enabled) return false
  if (useUnifiedHours) return unifiedHours.length > 0
  return day.hours.length > 0
}

// Helper: Obtenir le statut de publication d'un article
export const getArticleSocialStatus = (article: PendingArticle): ArticleSocialStatus => ({
  facebook: {
    published: !!article.published_on_facebook,
    published_at: article.published_on_facebook
  },
  linkedin: {
    published: !!article.published_on_linkedin,
    published_at: article.published_on_linkedin
  }
})

// Helper: Valider les préférences de publication
export interface PublishingPreferencesErrors {
  unified_hours?: string
  schedule?: Record<DayOfWeek, string>
}

export const validatePublishingPreferences = (
  prefs: SocialPublishingPreferences
): PublishingPreferencesErrors => {
  const errors: PublishingPreferencesErrors = {}

  // Vérifier les heures unifiées si activées
  if (prefs.use_unified_hours) {
    if (prefs.unified_hours.length === 0) {
      errors.unified_hours = 'Au moins une heure doit être définie'
    } else {
      const invalidHours = prefs.unified_hours.filter(h => !isValidHourFormat(h))
      if (invalidHours.length > 0) {
        errors.unified_hours = `Format d'heure invalide: ${invalidHours.join(', ')}`
      }
    }
  } else {
    // Vérifier que chaque jour activé a au moins une heure
    const scheduleErrors: Record<string, string> = {}
    Object.entries(prefs.schedule).forEach(([day, config]) => {
      if (config.enabled && config.hours.length === 0) {
        scheduleErrors[day] = 'Au moins une heure doit être définie pour ce jour'
      } else if (config.enabled) {
        const invalidHours = config.hours.filter((h: string) => !isValidHourFormat(h))
        if (invalidHours.length > 0) {
          scheduleErrors[day] = `Format d'heure invalide: ${invalidHours.join(', ')}`
        }
      }
    })
    if (Object.keys(scheduleErrors).length > 0) {
      errors.schedule = scheduleErrors as Record<DayOfWeek, string>
    }
  }

  return errors
}
