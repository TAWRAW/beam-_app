import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import MobileQuickNav from '@/components/layout/MobileQuickNav'
import { Poppins } from 'next/font/google'
import { avenirBlack } from './fonts'
import Script from 'next/script'
import GA from '@/components/analytics/GA'

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
        {/* Prefer GTM if provided; otherwise fall back to direct GA4 */}
        {process.env.NEXT_PUBLIC_GTM_ID ? (
          <>
            <Script id="gtm-init" strategy="afterInteractive">
              {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
            `}
            </Script>
            <noscript
              dangerouslySetInnerHTML={{
                __html: `
                <iframe src="https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}"
                        height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
              }}
            />
          </>
        ) : process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);} 
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', { send_page_view: false });
            `}
            </Script>
            <GA />
          </>
        ) : null}
        <Header />
        {/* Offset content for the fixed header using padding instead of a separate spacer */}
        <div className="pt-20 md:pt-24 min-h-screen">
          {children}
        </div>
        <Footer />
        <MobileQuickNav />
      </body>
    </html>
  )
}
