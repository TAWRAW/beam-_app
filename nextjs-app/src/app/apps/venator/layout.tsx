'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useUserRole } from '@/hooks/useUserRole'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/apps/venator', label: 'Dashboard' },
  { href: '/apps/venator/copros', label: 'Copros' },
]

export default function VenatorLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useUserRole()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/apps')
  }, [isAdmin, loading, router])

  if (!loading && !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#F2F1E6]">
      <header className="sticky top-0 z-10 bg-white border-b-2 border-black px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <h1 className="font-bold text-lg">🚀 Venator</h1>
          <nav className="flex items-center gap-2">
            {NAV.map((item) => {
              const active = item.href === '/apps/venator' ? pathname === item.href : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={cn(
                    'text-xs font-semibold px-3 py-1 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000] transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]',
                    active ? 'bg-[#FFC300]' : 'bg-white'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">{children}</main>
    </div>
  )
}
