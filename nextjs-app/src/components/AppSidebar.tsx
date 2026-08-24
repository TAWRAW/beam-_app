"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { cn } from '@/lib/utils'
import AppThemeToggle from '@/components/apps/AppThemeToggle'
import { ChevronsLeft, ChevronsRight, LogOut, LayoutDashboard, FileText, Users, User, Settings, Settings2, Printer, ClipboardList, ScrollText, Rocket, KeyRound, Send } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navigationItems: NavItem[] = [
  {
    href: '/apps',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
  },
  {
    href: '/apps/profile',
    label: 'Profil',
    icon: User,
  },
]

const adminItems: NavItem[] = [
  {
    href: '/apps/mandats',
    label: 'Mandats',
    icon: Settings,
    adminOnly: true,
  },
  {
    href: '/apps/users',
    label: 'Utilisateurs',
    icon: Users,
    adminOnly: true,
  },
  {
    href: '/apps/articles',
    label: 'Articles',
    icon: FileText,
    adminOnly: true,
  },
  {
    href: '/apps/visites',
    label: 'Visites',
    icon: ClipboardList,
    adminOnly: true,
  },
  {
    href: '/apps/venator',
    label: 'Venator',
    icon: Rocket,
    adminOnly: true,
  },
  {
    href: '/apps/cles',
    label: 'Clés',
    icon: KeyRound,
    adminOnly: true,
  },
  {
    href: '/apps/devis-mutation',
    label: 'Devis mutation',
    icon: ScrollText,
    adminOnly: true,
  },
  {
    href: '/apps/mailings',
    label: 'Mailing ciblé',
    icon: Send,
    adminOnly: true,
  },
  {
    href: '/apps/documents/generate',
    label: 'Documents',
    icon: Printer,
    adminOnly: true,
  },
  {
    href: '/apps/reglages',
    label: 'Réglages',
    icon: Settings2,
    adminOnly: true,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { isAdmin, loading } = useUserRole()
  const { isMobile, setOpenMobile, state, toggleSidebar } = useSidebar()
  const replie = state === 'collapsed'

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  // Filter admin items based on user role
  const visibleAdminItems = adminItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  // Force show all items in development mode
  const isDev = process.env.NODE_ENV === 'development'

  return (
    // collapsible="icon" : repliée, la barre garde la largeur des icônes
    // plutôt que de disparaître — la navigation reste accessible d'un coup d'œil.
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {/* Thème et repli vivent dans l'angle haut : des réglages qu'on touche
            rarement ne doivent pas occuper la place d'une action. Repliée, la
            barre ne garde que le chevron — le titre disparaît avec la largeur. */}
        <div
          className={cn(
            'flex items-center gap-1 py-2',
            replie ? 'flex-col px-1' : 'justify-between px-4'
          )}
        >
          {!replie && <h2 className="truncate text-lg font-semibold">Beamô Apps</h2>}
          <div className={cn('flex items-center gap-0.5', replie && 'flex-col')}>
            <AppThemeToggle />
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={replie ? 'Déplier le menu' : 'Replier le menu'}
              title={replie ? 'Déplier le menu' : 'Replier le menu'}
              className="flex h-7 w-7 items-center justify-center rounded-[var(--app-radius-btn)] text-app-fg-faint transition-colors hover:bg-app-surface-2 hover:text-app-fg"
            >
              {replie ? (
                <ChevronsRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronsLeft className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading && !isDev ? (
                <>
                  <SidebarMenuSkeleton showIcon />
                  <SidebarMenuSkeleton showIcon />
                </>
              ) : (
                navigationItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href as any} onClick={closeOnMobile}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {(isAdmin || loading || isDev) && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {loading && !isDev ? (
                  <>
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSkeleton showIcon />
                  </>
                ) : (
                  (isDev ? adminItems : visibleAdminItems).map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.href as any}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={"/logout" as any} className="text-red-600 hover:text-red-700" onClick={closeOnMobile}>
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
