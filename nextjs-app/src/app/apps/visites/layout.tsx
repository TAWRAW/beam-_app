'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { SyncIndicator } from '@/components/visites/SyncIndicator'
import { startHeartbeat } from '@/lib/visites/heartbeat-client'

export default function VisitesLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useUserRole()
  const router = useRouter()

  useEffect(() => {
    if (!loading && role !== 'admin') router.replace('/apps')
  }, [role, loading, router])

  useEffect(() => {
    startHeartbeat()
  }, [])

  // On ne bloque pas l'UI pendant le check de rôle : ça évite un flash
  // "Chargement…" plein écran à chaque navigation entre pages /apps/visites/*.
  // L'API serveur reste la source d'autorité ; si le rôle se résout en
  // non-admin, le useEffect ci-dessus redirige.
  if (!loading && role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F2F1E6]">
      <header className="sticky top-0 z-10 bg-white border-b-2 border-black px-4 py-3 flex items-center justify-between">
        <h1 className="font-bold text-lg">Visites</h1>
        <SyncIndicator />
      </header>
      <main className="p-4 max-w-2xl mx-auto">{children}</main>
    </div>
  )
}
