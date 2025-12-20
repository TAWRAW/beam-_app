import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Simulateur de Vote en AG — Beamô',
  description:
    'Simulez gratuitement les votes de votre assemblée générale de copropriété. Calculez les majorités (article 24, 25, 26) et les passerelles. Outil 100% gratuit et confidentiel.',
  keywords: [
    'simulateur vote copropriété',
    'assemblée générale copropriété',
    'majorité article 24',
    'majorité article 25',
    'majorité article 26',
    'tantièmes copropriété',
    'calcul majorité AG',
    'passerelle 25-1',
    'syndic copropriété',
  ],
  openGraph: {
    title: 'Simulateur de Vote en AG de Copropriété — Beamô',
    description:
      'Simulez gratuitement les votes de votre assemblée générale. Calculez les majorités et anticipez les résultats avant votre AG.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Simulateur de Vote en AG — Beamô',
    description:
      'Simulez gratuitement les votes de votre assemblée générale de copropriété.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function SimulateurVoteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
