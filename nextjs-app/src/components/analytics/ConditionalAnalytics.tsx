"use client"

import { useEffect, useState } from 'react'
import Script from 'next/script'
import GA from './GA'
import { hasConsent } from '@/lib/cookies-consent'

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

/**
 * Charge Google Analytics uniquement si l'utilisateur a donné son consentement
 * Conforme RGPD/CNIL : pas de chargement de scripts tiers sans consentement
 */
export default function ConditionalAnalytics() {
  const [canLoadAnalytics, setCanLoadAnalytics] = useState(false)

  useEffect(() => {
    // Vérifier le consentement au montage
    const checkConsent = () => {
      const hasAnalyticsConsent = hasConsent('analytics')
      setCanLoadAnalytics(hasAnalyticsConsent)

      if (hasAnalyticsConsent) {
        console.log('✅ Analytics consent granted, loading Google Analytics')
      } else {
        console.log('⚠️ Analytics consent not granted, Google Analytics blocked')
      }
    }

    checkConsent()

    // Écouter les changements de consentement
    const handleConsentChange = () => {
      checkConsent()
    }

    window.addEventListener('cookieConsentChanged', handleConsentChange)
    return () => window.removeEventListener('cookieConsentChanged', handleConsentChange)
  }, [])

  // Ne rien charger si pas de consentement
  if (!canLoadAnalytics) {
    return null
  }

  // Charger GTM si disponible, sinon GA4
  if (GTM_ID) {
    return (
      <>
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
        <noscript
          dangerouslySetInnerHTML={{
            __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          }}
        />
      </>
    )
  }

  if (GA_ID) {
    return (
      <>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              send_page_view: false,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `}
        </Script>
        <GA />
      </>
    )
  }

  return null
}
