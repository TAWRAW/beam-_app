"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

type NavItem = { href: string; label: string; icon?: React.ReactNode }

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
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M4 4h16v16H4z"/>
        <path d="M8 8h8M8 12h8M8 16h6"/>
      </svg>
    ),
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-64 shrink-0 border-r bg-white p-4 sticky top-0 h-screen hidden md:block">
      <div className="mb-6 font-semibold">Applications</div>
      <nav className="space-y-1">
        {items.map((item) => {
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
