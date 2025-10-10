import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
          <Card className="border-2 border-black bg-white p-10 shadow-xl text-center">
            <CardContent className="p-0">
              <h1 className="h1">En cours de construction</h1>
              <p className="mt-4 text-muted-foreground">Nous travaillons sur une expérience incroyable.</p>
              <img
                src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExODJsdzIzeGlpemd2dDBkeTMyaDAwNmhoMTRyNTYwYjg0aTh3ZG1iaSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/mcsPU3SkKrYDdW3aAU/giphy.gif"
                alt="Illustration — en construction"
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
      </section>
    </main>
  )
}

