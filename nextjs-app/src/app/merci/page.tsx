import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Merci — Beamô',
  description: 'Votre message a bien été envoyé. Nous vous répondons sous 48h.'
}

export default function MerciPage() {
  return (
    <main className="section">
      <div className="container">
        <Card className="border-2 border-black bg-white p-10 shadow-xl text-center">
          <CardContent className="p-0">
            <h1 className="h1">Merci !</h1>
            <p className="mt-4 text-muted-foreground">Votre message a bien été envoyé. Nous vous répondrons sous 48h.</p>
            <Button asChild className="mt-8 border-2 border-black">
              <Link href="/">Retour à l'accueil</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

