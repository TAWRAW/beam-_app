"use client"
export const dynamic = 'force-dynamic'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const search = useSearchParams()
  const redirect = search.get('redirect') || '/apps'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // use controlled state to avoid DOM lookup timing issues
        body: JSON.stringify({ email, password, redirect }),
        // ensure Set-Cookie from the response is stored by the browser
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Connexion refusée')
      window.location.href = data.redirect || '/apps'
    } catch (err: any) {
      setMessage(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Connexion</h1>
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="you@example.com"
            aria-label="Adresse e-mail"
          />
        </label>
        <label className="block">
          <span className="text-sm">Mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="••••••••"
            aria-label="Mot de passe"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>
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
