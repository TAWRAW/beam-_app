"use client"

import { useState, useEffect } from 'react'
import { X, Cookie, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  getConsent,
  saveConsent,
  acceptAllCookies,
  rejectAllCookies,
  type CookieConsent
} from '@/lib/cookies-consent'

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Vérifier si le consentement existe
    const consent = getConsent()
    if (!consent) {
      // Pas de consentement, afficher la bannière après un court délai
      setTimeout(() => setShowBanner(true), 1000)
    }
  }, [])

  const handleAcceptAll = () => {
    acceptAllCookies()
    setShowBanner(false)
    setShowSettings(false)
  }

  const handleRejectAll = () => {
    rejectAllCookies()
    setShowBanner(false)
    setShowSettings(false)
  }

  const handleSavePreferences = () => {
    saveConsent(preferences)
    setShowBanner(false)
    setShowSettings(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Overlay */}
      {showSettings && (
        <div
          className="absolute inset-0 bg-black/50 pointer-events-auto"
          onClick={() => setShowSettings(false)}
        />
      )}

      {/* Bannière */}
      <Card className="relative m-4 max-w-4xl w-full border-2 border-black shadow-2xl pointer-events-auto">
        <div className="p-6 bg-white rounded-lg">
          {!showSettings ? (
            // Vue simple
            <>
              <div className="flex items-start gap-4">
                <Cookie className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    🍪 Respect de votre vie privée
                  </h2>
                  <p className="text-sm text-gray-700 mb-4">
                    Nous utilisons des cookies pour améliorer votre expérience sur notre site.
                    Les cookies <strong>essentiels</strong> sont nécessaires au fonctionnement du site (authentification, préférences).
                    Les cookies <strong>analytiques</strong> nous aident à comprendre comment vous utilisez le site pour l'améliorer.
                  </p>
                  <p className="text-xs text-gray-600 mb-4">
                    Conformément à la réglementation française (RGPD/CNIL), vous pouvez choisir quels cookies accepter.
                    Votre consentement est valable 13 mois et modifiable à tout moment.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleAcceptAll}
                      className="border-2 border-black font-semibold"
                    >
                      ✅ Tout accepter
                    </Button>
                    <Button
                      onClick={handleRejectAll}
                      variant="outline"
                      className="border-2 border-gray-300 font-semibold"
                    >
                      ❌ Tout refuser
                    </Button>
                    <Button
                      onClick={() => setShowSettings(true)}
                      variant="outline"
                      className="border-2 border-primary font-semibold"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Personnaliser
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Vue paramètres
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Settings className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-bold text-gray-900">
                    Paramètres des cookies
                  </h2>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Cookies essentiels */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <Checkbox
                    checked={true}
                    disabled={true}
                    className="mt-1 opacity-50"
                  />
                  <div className="flex-1">
                    <Label className="text-base font-semibold text-gray-900 cursor-not-allowed">
                      Cookies essentiels
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Nécessaires au fonctionnement du site (authentification, panier, préférences de langue).
                      Ces cookies ne peuvent pas être désactivés.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Exemples : session utilisateur, sécurité CSRF
                    </p>
                  </div>
                </div>

                {/* Cookies analytiques */}
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-gray-200">
                  <Checkbox
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({ ...prev, analytics: checked as boolean }))
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label
                      className="text-base font-semibold text-gray-900 cursor-pointer"
                      onClick={() => setPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                    >
                      Cookies analytiques (Google Analytics)
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Nous permettent de comprendre comment vous utilisez le site pour l'améliorer
                      (pages visitées, durée, provenance). Données anonymisées.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Service : Google Analytics 4 (configuration anonyme)
                    </p>
                  </div>
                </div>

                {/* Cookies marketing */}
                <div className="flex items-start gap-3 p-4 bg-white rounded-lg border-2 border-gray-200 opacity-60">
                  <Checkbox
                    checked={preferences.marketing}
                    disabled={true}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <Label className="text-base font-semibold text-gray-900 cursor-not-allowed">
                      Cookies marketing
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Actuellement non utilisés. Pourraient être utilisés à l'avenir pour personnaliser
                      le contenu et mesurer l'efficacité de nos campagnes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                  className="border-2 border-gray-300"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="border-2 border-black font-semibold"
                >
                  Enregistrer mes choix
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Pour en savoir plus : consultez notre{' '}
                <a href="/politique-de-confidentialite" className="underline hover:text-primary">
                  politique de confidentialité
                </a>
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
