"use client";
import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

declare global {
  interface Window { gtag?: (...args: any[]) => void }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function GA() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!GA_ID || typeof window === 'undefined' || !window.gtag) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    window.gtag('config', GA_ID, { page_path: url })
  }, [pathname, searchParams])

  return null
}

export function trackEvent(name: string, params: Record<string, any> = {}) {
  if (!GA_ID || typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', name, params)
}

