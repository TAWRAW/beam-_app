'use client'

import { useEffect, useCallback } from 'react'
import { Map, X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const COMPTOIR_BASE_URL = 'https://www.le-comptoir-de-la-copropriete.fr'

interface MapSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (coproId: string) => void
  lat?: number
  lng?: number
  zoom?: number
  addressLabel?: string
}

export function MapSelectModal({
  isOpen,
  onClose,
  onSelect,
  lat,
  lng,
  zoom = 17,
  addressLabel,
}: MapSelectModalProps) {
  // Origines autorisées pour le postMessage
  const allowedOrigins = [
    'https://www.le-comptoir-de-la-copropriete.fr',
    'https://le-comptoir-de-la-copropriete.fr',
    // Localhost uniquement en développement
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000', 'http://localhost:3001'] : []),
  ]

  // Écouter les messages de l'iframe (carte du Comptoir)
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      // Vérifier l'origine pour la sécurité
      if (!allowedOrigins.includes(event.origin)) {
        return
      }

      // Vérifier le type de message
      if (event.data?.type === 'comptoir-copro-selected' && event.data?.id) {
        onSelect(event.data.id)
      }
    },
    [onSelect]
  )

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('message', handleMessage)
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [isOpen, handleMessage])

  // Construire l'URL de l'iframe
  const iframeSrc = (() => {
    const url = new URL(`${COMPTOIR_BASE_URL}/carte/embed`)
    if (lat !== undefined && lng !== undefined) {
      url.searchParams.append('lat', lat.toString())
      url.searchParams.append('lng', lng.toString())
      url.searchParams.append('zoom', zoom.toString())
    }
    return url.toString()
  })()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-base">
                  Sélectionnez votre copropriété sur la carte
                </DialogTitle>
                {addressLabel && (
                  <DialogDescription className="text-xs mt-0.5">
                    Recherche autour de : {addressLabel}
                  </DialogDescription>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 relative bg-muted">
          <iframe
            src={iframeSrc}
            className="absolute inset-0 w-full h-full border-0"
            title="Carte des copropriétés"
            allow="geolocation"
          />
        </div>

        <div className="px-4 py-3 border-t bg-muted/50 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Cliquez sur une copropriété puis sur "Sélectionner cette copropriété" pour la choisir
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
