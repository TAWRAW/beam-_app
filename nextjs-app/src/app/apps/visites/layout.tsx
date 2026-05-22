'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { SyncIndicator } from '@/components/visites/SyncIndicator'
import { startHeartbeat } from '@/lib/visites/heartbeat-client'

export default function VisitesLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useUserRole()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && role !== 'admin') router.replace('/apps')
  }, [role, loading, router])

  useEffect(() => {
    startHeartbeat()
  }, [])

  if (!loading && role !== 'admin') {
    return null
  }

  // Détecte les pages enfants d'une visite (lignes/new ou lignes/[id])
  // pour afficher un bouton Retour vers la page principale des lignes.
  const visiteLignesMatch = pathname?.match(/^\/apps\/visites\/([^/]+)\/([^/]+)\/lignes\//)
  const backHref = visiteLignesMatch
    ? `/apps/visites/${visiteLignesMatch[1]}/${visiteLignesMatch[2]}`
    : null

  // En mode terrain, on peut être hors-ligne : on évite <Link> qui déclenche
  // un fetch RSC (et tombe sur le dinosaure offline). À la place, router.back()
  // utilise le bfcache du navigateur quand on vient de la page liste lignes,
  // avec router.push en fallback si pas d'historique exploitable.
  const handleBack = () => {
    if (!backHref) return
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(backHref as any)
    }
  }

  return (
    <div className="min-h-screen bg-[#F2F1E6] overflow-x-hidden overscroll-contain">
      <header className="sticky top-0 z-10 bg-white border-b-2 border-black px-4 py-3 flex items-center justify-between gap-3">
        <h1 className="font-bold text-lg">Visites</h1>
        <div className="flex items-center gap-2 shrink-0">
          {backHref && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Retour aux lignes de la visite"
              className="text-xs font-semibold px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000] bg-[#FFC300] text-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition"
            >
              ← Retour
            </button>
          )}
          <SyncIndicator />
        </div>
      </header>
      <main className="p-4 max-w-2xl mx-auto">{children}</main>
    </div>
  )
}
