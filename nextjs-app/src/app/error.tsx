"use client";
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body>
        <main className="section">
          <div className="container">
            <div className="card p-10 text-center">
              <h1 className="h1">Une erreur est survenue</h1>
              <p className="mt-4 text-gray-700">Désolé pour le dérangement. Vous pouvez réessayer ou revenir à l’accueil.</p>
              {error?.digest && <p className="mt-2 text-xs text-gray-500">Code: {error.digest}</p>}
              <div className="mt-8 flex items-center justify-center gap-4">
                <button className="btn" onClick={() => reset()}>Réessayer</button>
                <Link className="btn btn-extranet" href="/">Retour à l’accueil</Link>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}

