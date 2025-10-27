import { Metadata } from 'next'

// Bloquer l'indexation de la page de connexion
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
