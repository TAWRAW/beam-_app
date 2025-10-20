"use client"

import { useState } from 'react'
import { X, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SocialIntegration } from '@/types/social-integration'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface TestConnectionModalProps {
  integration: SocialIntegration
  onClose: () => void
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

export function TestConnectionModal({
  integration,
  onClose
}: TestConnectionModalProps) {
  const [status, setStatus] = useState<TestStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleTest = async () => {
    setStatus('testing')
    setErrorMessage('')

    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Session expirée')
      }

      const response = await fetch(
        `/api/integrations/${integration.platform}/test`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors du test')
      }

      const data = await response.json()

      if (data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(data.error || 'Test échoué')
      }
    } catch (error) {
      console.error('Test error:', error)
      setStatus('error')
      setErrorMessage(
        error instanceof Error ? error.message : 'Erreur inconnue'
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Tester la connexion {integration.platform}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Compte:</span>{' '}
              {integration.platform_name || integration.platform_username || 'Non disponible'}
            </p>
            {integration.platform_username && (
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">Username:</span> @{integration.platform_username}
              </p>
            )}
          </div>

          {/* Status */}
          {status === 'idle' && (
            <p className="text-sm text-gray-600">
              Cliquez sur "Tester" pour vérifier que votre connexion fonctionne correctement.
            </p>
          )}

          {status === 'testing' && (
            <div className="flex items-center gap-3 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Test en cours...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-start gap-3 text-green-600 bg-green-50 rounded-lg p-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Connexion réussie !</p>
                <p className="text-xs mt-1">
                  Votre compte {integration.platform} est correctement connecté et prêt pour la publication automatique.
                </p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-3 text-red-600 bg-red-50 rounded-lg p-3">
              <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Échec de la connexion</p>
                <p className="text-xs mt-1">{errorMessage}</p>
                <p className="text-xs mt-2 text-red-700">
                  Essayez de rafraîchir votre token ou de vous reconnecter.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Fermer
          </Button>
          <Button
            onClick={handleTest}
            disabled={status === 'testing'}
            className="flex-1"
          >
            {status === 'testing' ? 'Test en cours...' : 'Tester'}
          </Button>
        </div>
      </div>
    </div>
  )
}
