import { ReactNode } from 'react'
import { Metadata } from 'next'
import { AppSidebar } from '@/components/AppSidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AlignJustify } from 'lucide-react'

// Bloquer l'indexation de toutes les pages admin
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function AppsLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header mobile */}
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 lg:hidden border-b">
          <SidebarTrigger className="h-8 w-8">
            <AlignJustify className="h-4 w-4" />
          </SidebarTrigger>
          <h1 className="text-lg font-semibold">Menu</h1>
        </header>

        <main className="flex-1 h-[calc(100vh-4rem)] lg:h-screen overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
