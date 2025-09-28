"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  redirect = '/apps',
  ...props
}: React.ComponentProps<"div"> & { redirect?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  // Vérifier s'il y a une erreur dans l'URL (callback OAuth)
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      if (urlError === 'auth_callback_error') {
        setError('Erreur lors de la connexion avec Google. Veuillez réessayer.')
      } else {
        setError('Erreur d\'authentification. Veuillez réessayer.')
      }
    }
  }, [searchParams])

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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="rounded-xl backdrop-blur-sm bg-white/95 border border-white/20 shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {mode === 'login' ? 'Bon retour' : 'Créer un compte'}
          </CardTitle>
          <CardDescription>
            {mode === 'login'
              ? 'Connectez-vous avec votre compte Google ou email'
              : 'Créez votre compte pour accéder aux applications'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <div className="grid gap-6">
              {/* Mode Toggle */}
              <div className="flex gap-2 rounded border p-1 w-full">
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

              {/* OAuth Button */}
              <div className="flex flex-col gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={signInWithGoogle}
                  disabled={gLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  {gLoading ? 'Redirection vers Google…' : 'Continuer avec Google'}
                </Button>
              </div>

              {/* Divider */}
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Ou continuer avec
                </span>
              </div>

              {/* Email/Password Form */}
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tom.lemeille@beamo.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Mot de passe</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Error/Success Messages */}
                {error && <p className="text-sm text-red-600">{error}</p>}
                {message && <p className="text-sm text-green-700">{message}</p>}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (mode === 'login' ? 'Connexion…' : 'Création…') : (mode === 'login' ? 'Se connecter' : 'Créer un compte')}
                </Button>
              </div>

              <div className="text-center text-sm">
                {mode === 'login' ? (
                  <>Vous n&apos;avez pas de compte ? Contactez-nous pour obtenir un accès.</>
                ) : (
                  <>Déjà un compte ? <button type="button" onClick={() => setMode('login')} className="underline underline-offset-4">Se connecter</button></>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs text-balance">
        En continuant, vous acceptez nos <a href="#" className="underline underline-offset-4 hover:text-primary">Conditions d&apos;utilisation</a>{" "}
        et notre <a href="#" className="underline underline-offset-4 hover:text-primary">Politique de confidentialité</a>.
      </div>
    </div>
  )
}