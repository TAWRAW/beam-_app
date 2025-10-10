'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LogoutPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Clear legacy session cookie
        document.cookie = 'app_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

        // Sign out from Supabase
        await supabase.auth.signOut()

        // Redirect to home page
        router.push('/')
        router.refresh()
      } catch (error) {
        console.error('Error during logout:', error)
        // Even if there's an error, redirect to home
        router.push('/')
      }
    }

    handleLogout()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Déconnexion en cours...</h1>
        <p className="text-muted-foreground">Vous allez être redirigé vers la page d'accueil.</p>
      </div>
    </div>
  )
}