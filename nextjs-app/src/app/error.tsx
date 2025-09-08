"use client"
import Link from 'next/link'

// Route-level error boundary: must NOT render <html>/<body>
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="section bg-primary relative -mt-20 md:-mt-24 pt-20 md:pt-24">
      <div className="container">
        <div className="card p-10 text-center">
          <h1 className="h1">Une erreur est survenue</h1>
          <p className="mt-4 text-gray-700">
            Désolé pour le dérangement. Vous pouvez réessayer ou revenir à l’accueil.
          </p>
          {error?.digest && (
            <p className="mt-2 text-xs text-gray-500">Code: {error.digest}</p>
          )}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button className="btn" onClick={() => reset()}>
              Réessayer
            </button>
            <Link className="btn btn-extranet" href="/">
              Retour à l’accueil
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
