"use client"

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import MobileQuickNav from './MobileQuickNav'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')

  if (isAuthPage) {
    // Pages d'authentification : pas de header/footer, plein écran
    return <>{children}</>
  }

  // Pages normales : avec header, footer et padding
  return (
    <>
      <Header />
      <div className="pt-20 md:pt-24 min-h-screen">
        {children}
      </div>
      <Footer />
      <MobileQuickNav />
    </>
  )
}