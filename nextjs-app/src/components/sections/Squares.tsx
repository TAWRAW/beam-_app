import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { X, Check } from 'lucide-react'

export default function Squares() {
  return (
    <section className="section bg-muted">
      <div className="container">
        <h2 className="h2 text-center font-semibold text-neutral">De nombreux copropriétaires nous contactent pour ces raisons :</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          {[
            ['Syndic en sous-effectif', '"Notre syndic est en sous-effectif, personne ne gère notre immeuble."'],
            ['Vente de portefeuille', '"On nous annonce la vente du portefeuille et on ne sait pas qui va nous gérer."'],
            ['Absence de réponse', '"Nos demandes restent sans réponse pendant des semaines."'],
            ['Opacité financière', '"Les comptes sont opaques, on ne sait pas où va notre argent."'],
          ].map(([title, p]) => (
            <Square key={title} title={title} desc={p} isNegative />
          ))}
        </div>

        <h2 className="h2 mt-16 text-center font-semibold text-neutral">Avec Beamô, c'est différent :</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          {[
            ['Stabilité', 'Un syndic stable et local qui ne vend pas ses copropriétés.'],
            ['Implication', 'Un interlocuteur unique, réactif et impliqué.'],
            ['Transparence', 'Un suivi transparent et digitalisé, pour voir en temps réel ce qui est fait.'],
            ['Réactivité', 'Des réponses garanties sous 48h ouvrées.'],
          ].map(([title, p]) => (
            <Square key={title} title={title} desc={p} isNegative={false} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Square({ title, desc, isNegative }: { title: string; desc: string; isNegative: boolean }) {
  return (
    <Card className="relative border-2 border-black bg-white p-6 shadow-lg transition-transform hover:-translate-y-2 hover:shadow-xl">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          {isNegative ? (
            <X className="h-5 w-5 shrink-0 text-red-600" />
          ) : (
            <Check className="h-5 w-5 shrink-0 text-green-600" />
          )}
          <span className="text-foreground">{title}</span>
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-muted-foreground">
          {desc}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
