"use client"
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
        <Card className="border-2 border-black bg-white p-10 shadow-xl text-center">
          <CardContent className="p-0">
            <h1 className="h1">Une erreur est survenue</h1>
            <p className="mt-4 text-muted-foreground">
              Désolé pour le dérangement. Vous pouvez réessayer ou revenir à l'accueil.
            </p>
            {error?.digest && (
              <p className="mt-2 text-xs text-muted-foreground">Code: {error.digest}</p>
            )}
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button className="border-2 border-black" onClick={() => reset()}>
                Réessayer
              </Button>
              <Button asChild variant="outline" className="border-2 border-primary">
                <Link href="/">Retour à l'accueil</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
