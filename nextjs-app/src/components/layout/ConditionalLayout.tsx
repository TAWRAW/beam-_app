"use client"

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import MobileQuickNav from './MobileQuickNav'
import { CookieBanner } from '@/components/cookies/CookieBanner'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith('/auth')
  const isAppsPage = pathname.startsWith('/apps')
  const isDocumentsPage = pathname.startsWith('/documents')

  if (isAuthPage || isDocumentsPage || isAppsPage) {
    // Pages d'authentification, documents et apps : pas de header/footer, plein écran
    return <>{children}</>
  }

  // Pages normales : avec header, footer, navigation mobile et bannière cookies
  return (
    <>
      <Header />
      <div className="pt-20 md:pt-24 min-h-screen">
        {children}
      </div>
      <Footer />
      <MobileQuickNav />
      {/* Bannière de cookies conforme RGPD/CNIL - affichée uniquement sur le site public */}
      {!isAppsPage && <CookieBanner />}
    </>
  )
}