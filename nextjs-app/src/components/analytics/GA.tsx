"use client";
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { hasConsent } from '@/lib/cookies-consent'

declare global {
  interface Window { gtag?: (...args: any[]) => void }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function GA() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [canTrack, setCanTrack] = useState(false)

  useEffect(() => {
    // Vérifier le consentement au montage
    const checkConsent = () => {
      setCanTrack(hasConsent('analytics'))
    }

    checkConsent()

    // Écouter les changements de consentement
    const handleConsentChange = () => {
      checkConsent()
    }

    window.addEventListener('cookieConsentChanged', handleConsentChange)
    return () => window.removeEventListener('cookieConsentChanged', handleConsentChange)
  }, [])

  useEffect(() => {
    // Ne tracker que si consentement donné
    if (!canTrack || !GA_ID || typeof window === 'undefined' || !window.gtag) return

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    window.gtag('config', GA_ID, { page_path: url })
  }, [pathname, searchParams, canTrack])

  return null
}

export function trackEvent(name: string, params: Record<string, any> = {}) {
  // Vérifier le consentement avant de tracker
  if (!hasConsent('analytics')) {
    console.log('⚠️ Analytics tracking blocked: no user consent')
    return
  }

  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params)
}

