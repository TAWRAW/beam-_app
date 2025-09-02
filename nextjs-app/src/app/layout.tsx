import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Poppins } from 'next/font/google'
import { avenirBlack } from './fonts'
import Script from 'next/script'

const poppins = Poppins({ subsets: ['latin'], weight: ['400','500','600','700'] })

export const metadata: Metadata = {
  title: 'Beamô — Syndic nouvelle génération',
  description: 'Beamô, syndic de copropriété moderne et transparent.',
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
        <Script
          src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"
          strategy="afterInteractive"
        />
        <Header />
        {/* Spacer to offset the fixed header height so content isn't hidden underneath */}
        <div aria-hidden className="h-20 md:h-24" />
        {children}
        <Footer />
      </body>
    </html>
  )
}
