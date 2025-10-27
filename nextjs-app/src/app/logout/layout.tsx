import { Metadata } from 'next'

// Bloquer l'indexation de la page de déconnexion
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function LogoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
