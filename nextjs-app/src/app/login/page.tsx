"use client"
export const dynamic = 'force-dynamic'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

function LoginContent() {
  const search = useSearchParams()
  const redirect = search.get('redirect') || '/apps'
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <LoginForm redirect={redirect} />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Chargement…</div>}>
      <LoginContent />
    </Suspense>
  )
}
