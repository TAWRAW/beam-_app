import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "En cours de construction | Beamô",
  description: "Nous travaillons sur une expérience incroyable. Revenez très vite.",
  alternates: { canonical: '/en-cours' },
  robots: { index: false, follow: true },
}

export default function EnCoursPage() {
  return (
    <main>
      <section className="section bg-primary relative -mt-20 md:-mt-24 pt-20 md:pt-24">
        <div className="container">
          <div className="card p-10 text-center">
            <h1 className="h1">En cours de construction</h1>
            <p className="mt-4 text-gray-700">Nous travaillons sur une expérience incroyable.</p>
            <img
              src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODJsdzIzeGlpemd2dDBkeTMyaDAwNmhoMTRyNTYwYjg0aTh3ZG1iaSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mcsPU3SkKrYDdW3aAU/giphy.gif"
              alt="Illustration — en construction"
              className="mx-auto mt-6 w-full max-w-md rounded"
            />
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link className="btn" href="/">Retour à l’accueil</Link>
              <Link className="btn btn-extranet" href="/ressources/contact">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

