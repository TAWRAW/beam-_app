"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { LogOut, LayoutDashboard, FileText, Users, User, Settings, Settings2, Printer, ClipboardList } from 'lucide-react'
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
  const { isMobile, setOpenMobile } = useSidebar()

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
    <Sidebar>
      <SidebarHeader>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Beamô Apps</h2>
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
