"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useUserRole } from '@/hooks/useUserRole'

type NavItem = { 
  href: string; 
  label: string; 
  icon?: React.ReactNode;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  {
    href: '/apps',
    label: 'Tableau de bord',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: '/apps/mandats',
    label: 'Mandats',
    adminOnly: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 4h16v16H4z"/>
        <path d="M8 8h8M8 12h8M8 16h6"/>
      </svg>
    ),
  },
  {
    href: '/apps/users',
    label: 'Utilisateurs',
    adminOnly: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/apps/articles',
    label: 'Articles',
    adminOnly: true,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { isAdmin, loading } = useUserRole()

  // Filter items based on user role
  const visibleItems = items.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  if (loading) {
    return (
      <aside className="w-64 shrink-0 border-r bg-white p-4 sticky top-0 h-screen hidden md:block">
        <div className="mb-6 font-semibold">Applications</div>
        <div className="animate-pulse space-y-2">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-64 shrink-0 border-r bg-white p-4 sticky top-0 h-screen hidden md:block">
      <div className="mb-6 font-semibold">Applications</div>
      <nav className="space-y-1">
        {visibleItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href as any}
              className={clsx(
                'flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-gray-100',
                active && 'bg-gray-100 font-medium',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mt-6 border-t pt-4">
        <Link href="/logout" className="text-sm text-red-600 hover:underline">
          Déconnexion
        </Link>
      </div>
    </aside>
  )
}
