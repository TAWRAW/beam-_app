"use client"

import { useState } from 'react'
import { Facebook, Linkedin, Clock, Calendar, Save, Loader2, Plus, X } from 'lucide-react'
import type {
  SocialPublishingPreferences,
  DayOfWeek,
  DaySchedule
} from '@/types/social-publishing'
import {
  DAYS_OF_WEEK,
  AVAILABLE_HOURS,
  getDefaultPreferences,
  validatePublishingPreferences
} from '@/types/social-publishing'

interface Props {
  initialPreferences?: SocialPublishingPreferences
  onSave: (preferences: SocialPublishingPreferences) => Promise<void>
}

export function SocialPublishingPreferencesComponent({ initialPreferences, onSave }: Props) {
  const [preferences, setPreferences] = useState<SocialPublishingPreferences>(
    initialPreferences || getDefaultPreferences()
  )
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<ReturnType<typeof validatePublishingPreferences>>({})

  // Toggle activation générale
  const toggleEnabled = () => {
    setPreferences(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  // Toggle heures unifiées
  const toggleUnifiedHours = () => {
    setPreferences(prev => ({ ...prev, use_unified_hours: !prev.use_unified_hours }))
  }

  // Ajouter une heure unifiée
  const addUnifiedHour = (hour: string) => {
    if (!preferences.unified_hours.includes(hour)) {
      setPreferences(prev => ({
        ...prev,
        unified_hours: [...prev.unified_hours, hour].sort()
      }))
    }
  }

  // Retirer une heure unifiée
  const removeUnifiedHour = (hour: string) => {
    setPreferences(prev => ({
      ...prev,
      unified_hours: prev.unified_hours.filter(h => h !== hour)
    }))
  }

  // Toggle un jour spécifique
  const toggleDay = (day: DayOfWeek) => {
    setPreferences(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          enabled: !prev.schedule[day].enabled
        }
      }
    }))
  }

  // Ajouter une heure à un jour spécifique
  const addDayHour = (day: DayOfWeek, hour: string) => {
    const daySchedule = preferences.schedule[day]
    if (!daySchedule.hours.includes(hour)) {
      setPreferences(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...daySchedule,
            hours: [...daySchedule.hours, hour].sort()
          }
        }
      }))
    }
  }

  // Retirer une heure d'un jour spécifique
  const removeDayHour = (day: DayOfWeek, hour: string) => {
    setPreferences(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          hours: prev.schedule[day].hours.filter(h => h !== hour)
        }
      }
    }))
  }

  // Sauvegarder
  const handleSave = async () => {
    // Validation
    const validationErrors = validatePublishingPreferences(preferences)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    setSaving(true)
    try {
      await onSave(preferences)
      alert('Préférences de publication sauvegardées avec succès !')
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            <Linkedin className="h-5 w-5 text-blue-700" />
            Publication automatique sur les réseaux sociaux
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configurez les horaires de publication automatique de vos articles sur Facebook et LinkedIn
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.enabled}
            onChange={toggleEnabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {preferences.enabled && (
        <>
          {/* Mode d'horaires */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.use_unified_hours}
                onChange={toggleUnifiedHours}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <div>
                <span className="font-medium">Utiliser les mêmes heures pour tous les jours</span>
                <p className="text-sm text-gray-600">
                  Si activé, les mêmes heures seront appliquées à tous les jours sélectionnés
                </p>
              </div>
            </label>
          </div>

          {preferences.use_unified_hours ? (
            /* Mode heures unifiées */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Heures de publication
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {preferences.unified_hours.map(hour => (
                    <div key={hour} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      <span>{hour}</span>
                      <button
                        onClick={() => removeUnifiedHour(hour)}
                        className="hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addUnifiedHour(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Ajouter une heure...</option>
                  {AVAILABLE_HOURS.map(hour => (
                    <option key={hour} value={hour} disabled={preferences.unified_hours.includes(hour)}>
                      {hour}
                    </option>
                  ))}
                </select>
                {errors.unified_hours && (
                  <p className="text-sm text-red-600 mt-1">{errors.unified_hours}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Jours de publication
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DAYS_OF_WEEK.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.schedule[value].enabled}
                        onChange={() => toggleDay(value)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mode heures par jour */
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Configuration par jour
              </label>
              {DAYS_OF_WEEK.map(({ value, label }) => {
                const daySchedule = preferences.schedule[value]
                return (
                  <div key={value} className="border rounded-lg p-4 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={daySchedule.enabled}
                        onChange={() => toggleDay(value)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="font-medium">{label}</span>
                    </label>

                    {daySchedule.enabled && (
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {daySchedule.hours.map(hour => (
                            <div key={hour} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm">
                              <span>{hour}</span>
                              <button
                                onClick={() => removeDayHour(value, hour)}
                                className="hover:bg-primary/20 rounded-full p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addDayHour(value, e.target.value)
                              e.target.value = ''
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Ajouter une heure...</option>
                          {AVAILABLE_HOURS.map(hour => (
                            <option key={hour} value={hour} disabled={daySchedule.hours.includes(hour)}>
                              {hour}
                            </option>
                          ))}
                        </select>
                        {errors.schedule?.[value] && (
                          <p className="text-sm text-red-600 mt-1">{errors.schedule[value]}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Bouton sauvegarder */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Sauvegarder les préférences
            </button>
          </div>
        </>
      )}
    </div>
  )
}
