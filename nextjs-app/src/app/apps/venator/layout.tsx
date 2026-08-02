'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Rocket } from 'lucide-react'
import { useUserRole } from '@/hooks/useUserRole'
import VenatorShell from './_components/nav/VenatorShell'
import './venator-theme.css'

function VenatorShellFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm text-venator-fg-muted">
      Chargement…
    </div>
  )
}

export default function VenatorLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useUserRole()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/apps')
  }, [isAdmin, loading, router])

  if (!loading && !isAdmin) {
    return null
  }

  return (
    <div className="venator-theme min-h-screen bg-venator-bg text-venator-fg">
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-venator-bg/80 px-4 py-3.5 backdrop-blur-xl md:px-6">
        <Rocket className="h-4 w-4 text-venator-accent" />
        <h1 className="text-[13px] font-semibold tracking-[-0.01em]">Venator</h1>
      </header>

      <Suspense fallback={<VenatorShellFallback />}>
        <VenatorShell>{children}</VenatorShell>
      </Suspense>
    </div>
  )
}
