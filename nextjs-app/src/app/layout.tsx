import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Poppins } from 'next/font/google'
import { avenirBlack } from './fonts'

const poppins = Poppins({ subsets: ['latin'], weight: ['400','500','600','700'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://xn--beam-yqa.fr'),
  title: {
    default: 'Beamô — Syndic nouvelle génération',
    template: '%s | Beamô',
  },
  description: 'Beamô, syndic de copropriété moderne et transparent.',
  openGraph: {
    type: 'website',
    url: 'https://xn--beam-yqa.fr',
    title: 'Beamô — Syndic nouvelle génération',
    description: 'Beamô, syndic de copropriété moderne et transparent.',
    images: ['/outils/images/beamocomptearebour.png'],
  },
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.ico' }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`${poppins.className} ${avenirBlack.variable}`}>
        <Header />
        {/* Spacer to offset the fixed header height so content isn't hidden underneath */}
        <div aria-hidden className="h-20 md:h-24" />
        {children}
        <Footer />
      </body>
    </html>
  )
}
