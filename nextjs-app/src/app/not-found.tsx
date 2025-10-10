import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <main className="section bg-primary relative -mt-20 md:-mt-24 pt-20 md:pt-24">
      <div className="container">
        <Card className="border-2 border-black bg-white p-10 shadow-xl text-center">
          <CardContent className="p-0">
            <h1 className="h1">404 — Page introuvable</h1>
            <p className="mt-4 text-muted-foreground">La page que vous cherchez n'existe pas ( encore ) ou a été déplacée.</p>
            <img
              src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODJsdzIzeGlpemd2dDBkeTMyaDAwNmhoMTRyNTYwYjg0aTh3ZG1iaSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mcsPU3SkKrYDdW3aAU/giphy.gif"
              alt="Illustration fun — en construction"
              className="mx-auto mt-6 w-full max-w-md rounded"
            />
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button asChild className="border-2 border-black">
                <Link href="/">Retour à l'accueil</Link>
              </Button>
              <Button asChild variant="outline" className="border-2 border-primary">
                <Link href="/ressources/contact">Nous contacter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
