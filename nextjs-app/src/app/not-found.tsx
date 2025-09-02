import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="mt-4 text-gray-600">La page que vous cherchez n’existe pas.</p>
      <p className="mt-6"><Link className="text-primary" href="/">Retour à l’accueil</Link></p>
    </main>
  )
}

