import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-theme(spacing.20))] bg-primary relative -mt-20 md:-mt-24 pt-20 md:pt-24 pb-0 mb-0 flex items-center">
      <div className="container">
        <Card className="bg-white p-10 shadow-xl text-center">
          <CardContent className="p-0">
            <h1 className="h1">404 — Page introuvable</h1>
            <p className="mt-4 text-muted-foreground">La page que vous cherchez n'existe pas ( encore ) ou a été déplacée.</p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button asChild variant="outline" className="bg-white">
                <Link href="/">Retour à l'accueil</Link>
              </Button>
              <Button asChild variant="default">
                <Link href="/ressources/contact">Nous contacter</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
