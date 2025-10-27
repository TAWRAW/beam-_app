import { Metadata } from 'next'

// Bloquer l'indexation de la page de confirmation
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function MerciLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
