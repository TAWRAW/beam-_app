'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { KeyRound } from 'lucide-react'

export default function ClesLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useUserRole()
  const router = useRouter()
  // En dev, pas de gating (cohérent avec AppSidebar/visites) ; en prod, admin/employé.
  const isDev = process.env.NODE_ENV === 'development'

  useEffect(() => {
    if (!loading && !isDev && !isAdmin) router.replace('/apps')
  }, [isAdmin, loading, isDev, router])

  if (!loading && !isDev && !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-app-bg overflow-x-hidden">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b-2 border-app-border-strong bg-app-surface px-4 py-3">
        <KeyRound className="h-5 w-5 text-amber-500" />
        <h1 className="text-lg font-bold">Clés</h1>
        <span className="ml-2 hidden text-xs text-app-fg-muted sm:inline">
          Accès parties communes — inventaire, remises, facturation
        </span>
      </header>
      <main className="mx-auto max-w-5xl p-4">{children}</main>
    </div>
  )
}
