import { ReactNode } from 'react'
import { Metadata } from 'next'
import { AppSidebar } from '@/components/AppSidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AlignJustify } from 'lucide-react'
import { appThemeInitScript } from '@/components/apps/AppThemeToggle'
import { ModeConfidentielProvider } from '@/components/apps/ModeConfidentiel'
import './apps-theme.css'

// Bloquer l'indexation de toutes les pages admin
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AppsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="beam-apps">
      {/* Pose le thème avant le premier rendu, sinon la page s'affiche en clair
          puis bascule. Chaîne statique construite à la compilation : aucune
          donnée utilisateur n'y transite. */}
      <script dangerouslySetInnerHTML={{ __html: appThemeInitScript }} />

      <ModeConfidentielProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-app-bg">
          {/* Header mobile */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-app-border px-4 lg:hidden">
            <SidebarTrigger className="h-8 w-8 text-app-fg">
              <AlignJustify className="h-4 w-4" />
            </SidebarTrigger>
            <h1 className="text-lg font-semibold text-app-fg">Menu</h1>
          </header>

          <main className="h-[calc(100vh-4rem)] flex-1 overflow-auto lg:h-screen">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      </ModeConfidentielProvider>
    </div>
  )
}
