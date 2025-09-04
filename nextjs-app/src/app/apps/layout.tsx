import { ReactNode } from 'react'
import { AppSidebar } from '@/components/AppSidebar'

export default function AppsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <AppSidebar />
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">{children}</main>
    </div>
  )
}
