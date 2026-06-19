import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import MobileQuickNav from '@/components/layout/MobileQuickNav'
import { Poppins } from 'next/font/google'
import { avenirBlack } from './fonts'
import ConditionalAnalytics from '@/components/analytics/ConditionalAnalytics'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import { Analytics } from '@vercel/analytics/next'
import ServiceWorkerRegister from '@/components/pwa/ServiceWorkerRegister'

const poppins = Poppins({ subsets: ['latin'], weight: ['400','500','600','700'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.xn--beam-yqa.fr'),
  title: {
    default: 'Beamô — Syndic nouvelle génération',
    template: '%s | Beamô',
  },
  description: 'Beamô, syndic de copropriété moderne et transparent. Proximité, réactivité et écoute au service de votre copropriété à Vernon, Évreux, Les Andelys et leurs environs.',
  keywords: ['syndic', 'syndic de copropriété', 'gestion copropriété', 'Vernon', 'Évreux', 'Les Andelys', 'Normandie', 'Eure', 'assemblée générale', 'transparence'],
  authors: [{ name: 'Beamô' }],
  creator: 'Beamô',
  publisher: 'Beamô',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Beamô',
    url: 'https://www.xn--beam-yqa.fr',
    title: 'Beamô — Syndic nouvelle génération',
    description: 'Beamô, syndic de copropriété moderne et transparent. Proximité, réactivité et écoute au service de votre copropriété.',
    images: [
      {
        url: '/outils/images/beamocomptearebour.png',
        width: 1200,
        height: 630,
        alt: 'Beamô - Syndic de copropriété nouvelle génération',
      }
    ],
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beamô — Syndic nouvelle génération',
    description: 'Syndic de copropriété moderne et transparent. Proximité, réactivité et écoute.',
    images: ['/outils/images/beamocomptearebour.png'],
  },
  alternates: { canonical: '/' },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'Beamô Visites',
    statusBarStyle: 'default',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Force rebuild 2025-10-09 for GTM injection + RGPD cookie consent
  return (
    <html lang="fr">
      <body className={`${poppins.className} ${avenirBlack.variable}`}>
        {/* Google Analytics chargé uniquement si consentement cookies donné (conforme RGPD/CNIL) */}
        <ConditionalAnalytics />
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
