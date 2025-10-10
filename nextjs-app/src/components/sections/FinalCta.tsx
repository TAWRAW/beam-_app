import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target } from 'lucide-react'

export default function FinalCta() {
  return (
    <section className="section bg-primary">
      <div className="container flex flex-col items-center gap-10 md:flex-row">
        <Card className="flex-1 border-2 border-black bg-white p-10 shadow-xl">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-100">
                <Target className="h-7 w-7 text-orange-600" />
              </div>
              <span className="text-foreground">Changez pour un syndic qui vous respecte</span>
            </CardTitle>
            <CardDescription className="mt-4 text-base text-muted-foreground">
              Parce qu'un <strong className="text-foreground">syndic efficace, réactif et transparent</strong> ne devrait pas être une exception.
            </CardDescription>
          </CardHeader>
          <CardFooter className="mt-6 p-0">
            <Button asChild size="lg" className="border-2 border-black">
              <Link href="/ressources/contact">Nous contacter</Link>
            </Button>
          </CardFooter>
        </Card>
        <div className="flex flex-1 items-center justify-center">
          <img src="/outils/images/image-removebg-preview.png" alt="Illustration syndic de confiance" className="max-w-md" />
        </div>
      </div>
    </section>
  )
}
