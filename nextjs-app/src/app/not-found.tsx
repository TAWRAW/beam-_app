import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="section bg-primary">
      <div className="container">
        <div className="card p-10 text-center">
          <h1 className="h1">404 — Page introuvable</h1>
          <p className="mt-4 text-gray-700">La page que vous cherchez n’existe pas ( encore ) ou a été déplacée.</p>
          <img
            src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODJsdzIzeGlpemd2dDBkeTMyaDAwNmhoMTRyNTYwYjg0aTh3ZG1iaSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mcsPU3SkKrYDdW3aAU/giphy.gif"
            alt="Illustration fun — en construction"
            className="mx-auto mt-6 w-full max-w-md rounded"
          />
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link className="btn" href="/">Retour à l’accueil</Link>
            <Link className="btn btn-extranet" href="/ressources/contact">Nous contacter</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
