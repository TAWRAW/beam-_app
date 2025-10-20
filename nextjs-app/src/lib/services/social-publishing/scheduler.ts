// Logique de planification pour déterminer quand publier
// Date: 20 octobre 2025

import type { SocialPublishingPreferences } from '@/types/social-publishing'
import type { DayOfWeek } from '@/types/social-publishing'

/**
 * Détermine si c'est le bon moment pour publier selon les préférences utilisateur
 *
 * @param preferences - Préférences de publication de l'utilisateur
 * @param currentTime - Date/heure actuelle (optionnel, défaut: Date actuelle)
 * @returns true si c'est le bon moment pour publier
 */
export function shouldPublishNow(
  preferences?: SocialPublishingPreferences,
  currentTime: Date = new Date()
): boolean {
  // Si pas de préférences ou désactivé, ne pas publier
  if (!preferences || !preferences.enabled) {
    return false
  }

  // Obtenir le jour et l'heure actuels
  const dayOfWeek = getDayOfWeek(currentTime)
  const currentHour = getCurrentTimeString(currentTime)

  // Déterminer les heures à vérifier
  let hoursToCheck: string[]

  if (preferences.use_unified_hours) {
    // Mode heures unifiées
    hoursToCheck = preferences.unified_hours

    // Vérifier que le jour est activé
    const daySchedule = preferences.schedule[dayOfWeek]
    if (!daySchedule || !daySchedule.enabled) {
      return false
    }
  } else {
    // Mode heures par jour
    const daySchedule = preferences.schedule[dayOfWeek]

    if (!daySchedule || !daySchedule.enabled) {
      return false
    }

    hoursToCheck = daySchedule.hours
  }

  // Vérifier si l'heure actuelle correspond à une heure de publication
  return hoursToCheck.some(targetTime =>
    isWithinTimeWindow(targetTime, currentHour)
  )
}

/**
 * Vérifie si l'heure actuelle est dans la fenêtre de publication
 * (±15 minutes de marge)
 *
 * @param targetTime - Heure cible (format HH:MM)
 * @param currentTime - Heure actuelle (format HH:MM)
 * @param marginMinutes - Marge en minutes (défaut: 15)
 * @returns true si dans la fenêtre
 */
export function isWithinTimeWindow(
  targetTime: string,
  currentTime: string,
  marginMinutes: number = 15
): boolean {
  const targetMinutes = timeStringToMinutes(targetTime)
  const currentMinutes = timeStringToMinutes(currentTime)

  const diff = Math.abs(targetMinutes - currentMinutes)

  // Gérer le cas du passage minuit (ex: 23:55 -> 00:05)
  const diffOverMidnight = Math.abs(1440 - diff) // 1440 = 24h en minutes

  return Math.min(diff, diffOverMidnight) <= marginMinutes
}

/**
 * Convertit une string HH:MM en minutes depuis minuit
 */
function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Obtient le jour de la semaine actuel
 */
function getDayOfWeek(date: Date): DayOfWeek {
  const dayNames: DayOfWeek[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
  ]

  return dayNames[date.getDay()]
}

/**
 * Obtient l'heure actuelle au format HH:MM
 */
function getCurrentTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Calcule la prochaine date/heure de publication
 *
 * @param preferences - Préférences de publication
 * @param fromDate - Date de départ (défaut: maintenant)
 * @returns Prochaine date de publication ou null si aucune
 */
export function getNextPublicationTime(
  preferences?: SocialPublishingPreferences,
  fromDate: Date = new Date()
): Date | null {
  if (!preferences || !preferences.enabled) {
    return null
  }

  const currentDate = new Date(fromDate)
  const maxDaysToCheck = 14 // Chercher max 2 semaines dans le futur

  for (let daysAhead = 0; daysAhead < maxDaysToCheck; daysAhead++) {
    const checkDate = new Date(currentDate)
    checkDate.setDate(checkDate.getDate() + daysAhead)

    const dayOfWeek = getDayOfWeek(checkDate)
    const daySchedule = preferences.schedule[dayOfWeek]

    if (!daySchedule || !daySchedule.enabled) {
      continue
    }

    // Déterminer les heures pour ce jour
    const hoursToCheck = preferences.use_unified_hours
      ? preferences.unified_hours
      : daySchedule.hours

    // Pour le jour actuel, ne considérer que les heures futures
    const currentTime = daysAhead === 0 ? getCurrentTimeString(currentDate) : '00:00'
    const currentMinutes = timeStringToMinutes(currentTime)

    // Trier les heures
    const sortedHours = [...hoursToCheck].sort()

    for (const targetTime of sortedHours) {
      const targetMinutes = timeStringToMinutes(targetTime)

      // Si c'est aujourd'hui, vérifier que l'heure est dans le futur
      if (daysAhead === 0 && targetMinutes <= currentMinutes) {
        continue
      }

      // Construire la date complète
      const [hours, minutes] = targetTime.split(':').map(Number)
      const publicationDate = new Date(checkDate)
      publicationDate.setHours(hours, minutes, 0, 0)

      return publicationDate
    }
  }

  return null
}

/**
 * Vérifie si les préférences sont valides
 */
export function arePreferencesValid(
  preferences?: SocialPublishingPreferences
): boolean {
  if (!preferences || !preferences.enabled) {
    return false
  }

  if (preferences.use_unified_hours) {
    // Vérifier qu'il y a au moins une heure et au moins un jour activé
    if (preferences.unified_hours.length === 0) {
      return false
    }

    const hasEnabledDay = Object.values(preferences.schedule).some(day => day.enabled)
    return hasEnabledDay
  } else {
    // Vérifier qu'au moins un jour a des heures configurées
    return Object.values(preferences.schedule).some(
      day => day.enabled && day.hours.length > 0
    )
  }
}

/**
 * Obtient le résumé des préférences (pour affichage/debug)
 */
export function getPreferencesSummary(
  preferences?: SocialPublishingPreferences
): string {
  if (!preferences || !preferences.enabled) {
    return 'Publication désactivée'
  }

  if (preferences.use_unified_hours) {
    const enabledDays = Object.entries(preferences.schedule)
      .filter(([_, day]) => day.enabled)
      .map(([dayName]) => dayName)

    return `Heures unifiées: ${preferences.unified_hours.join(', ')} | Jours: ${enabledDays.join(', ')}`
  } else {
    const schedule = Object.entries(preferences.schedule)
      .filter(([_, day]) => day.enabled && day.hours.length > 0)
      .map(([dayName, day]) => `${dayName}: ${day.hours.join(', ')}`)

    return schedule.length > 0 ? schedule.join(' | ') : 'Aucun horaire configuré'
  }
}
