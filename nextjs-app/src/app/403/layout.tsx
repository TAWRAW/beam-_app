import { Metadata } from 'next'

// Bloquer l'indexation de la page d'erreur 403
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function Error403Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
