"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function LoginForm({ redirect = '/apps' }: { redirect?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  const callbackUrl = useMemo(() => {
    // Utilise NEXT_PUBLIC_SITE_URL si défini (permet d'imposer le domaine punycode en prod)
    const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : undefined)
    if (!base) return undefined
    return `${String(base).replace(/\/$/, '')}/auth/callback?redirect=${encodeURIComponent(redirect)}`
  }, [redirect])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }
        router.replace(redirect as any)
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: callbackUrl ? { emailRedirectTo: callbackUrl } : undefined,
        })
        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }
        setMessage("Compte créé. Vérifiez votre email pour confirmer votre adresse.")
        setMode('login')
        setLoading(false)
      }
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  async function signInWithGoogle() {
    setError(null)
    setMessage(null)
    setGLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: callbackUrl ? { redirectTo: callbackUrl } : undefined,
      })
      if (error) setError(error.message)
      // Browser will redirect to Google; no further action here
    } catch (e: any) {
      setError(e?.message || 'Erreur de connexion Google')
    } finally {
      // Keep button disabled only until redirection happens
      setGLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded border p-1 w-full max-w-sm">
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm ${mode === 'login' ? 'bg-neutral-100 font-medium' : ''}`}
          onClick={() => setMode('login')}
        >
          Se connecter
        </button>
        <button
          type="button"
          className={`flex-1 rounded px-3 py-2 text-sm ${mode === 'signup' ? 'bg-neutral-100 font-medium' : ''}`}
          onClick={() => setMode('signup')}
        >
          Créer un compte
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="tom.lemeille@beamo.fr"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button
          type="submit"
          className="w-full rounded bg-primary px-4 py-2 font-semibold text-white disabled:opacity-70"
          disabled={loading}
        >
          {loading ? (mode === 'login' ? 'Connexion…' : 'Création…') : (mode === 'login' ? 'Se connecter' : 'Créer un compte')}
        </button>
      </form>

      <div className="relative">
        <div className="my-4 text-center text-xs text-neutral-500">ou</div>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full rounded border px-4 py-2 font-medium hover:bg-neutral-50 disabled:opacity-70"
          disabled={gLoading}
        >
          {gLoading ? 'Redirection vers Google…' : 'Continuer avec Google'}
        </button>
      </div>
    </div>
  )
}

export default LoginForm
