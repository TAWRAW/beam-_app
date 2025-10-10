import { Card, CardContent } from '@/components/ui/card'

export default function Services() {
  return (
    <section className="section bg-muted">
      <div className="container">
        <h2 className="h2 font-semibold text-neutral">Nos services de syndic</h2>
        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            'Gestion administrative et comptable',
            'Tenue des assemblées générales et conseils syndical',
            'Suivi des travaux et des prestataires',
            'Gestion des sinistres et assurances',
            'Transparence des dépenses et reporting',
            'Portail copropriétaire (documents, interventions, suivi)'
          ].map((s) => (
            <li key={s}>
              <Card className="border-2 border-black bg-white p-4 shadow-lg">
                <CardContent className="p-0">✅ {s}</CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

