/**
 * PAGE DE CONNEXION - Beamô Administration
 *
 * Page de connexion pour accéder à l'interface d'administration.
 * Utilise un système d'auth temporaire simple (email/password).
 *
 * FONCTIONNALITÉS:
 * - Formulaire de connexion sécurisé
 * - Redirection automatique après login (param ?redirect=)
 * - Support des sessions HMAC signées
 * - Interface responsive avec design moderne
 *
 * SÉCURITÉ:
 * - Force dynamic pour éviter le cache des données sensibles
 * - Validation côté serveur via API /auth/login
 * - Session sécurisée avec cookies httpOnly
 *
 * MAINTENANCE:
 * - Le composant LoginForm contient la logique principale
 * - Pour changer l'auth: modifier /api/auth/login et LoginForm
 * - Redirection par défaut: /apps (dashboard admin)
 */

"use client"
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

function LoginContent() {
  const search = useSearchParams()
  // Récupère l'URL de redirection ou redirige vers le dashboard admin par défaut
  const redirect = search.get('redirect') || '/apps'

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Connexion</h1>
        {/* Composant formulaire avec logique d'auth */}
        <LoginForm redirect={redirect} />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    // Suspense nécessaire pour useSearchParams (hook client)
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <LoginContent />
    </Suspense>
  )
}
