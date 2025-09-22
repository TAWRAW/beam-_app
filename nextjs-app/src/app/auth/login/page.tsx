"use client"

import { useSearchParams } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  const search = useSearchParams()
  const redirect = search.get('redirect') || '/apps'

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="h1 mb-6">Connexion</h1>
      <LoginForm redirect={redirect} />
      <p className="mt-4 text-sm text-gray-600">
        Vous n’avez pas de compte ? Contactez-nous pour obtenir un accès.
      </p>
    </div>
  )
}
