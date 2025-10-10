import { Card, CardContent } from '@/components/ui/card'

type FAQItem = { q: string; a: string }

export default function FAQ({ items, id = 'faq' }: { items: FAQItem[]; id?: string }) {
  return (
    <section id={id} className="section">
      <div className="container">
        <h2 className="h2 text-center font-semibold text-neutral">Questions fréquentes</h2>
        <div className="mt-8 space-y-4">
          {items.map((it, idx) => (
            <Card key={idx} className="border-2 border-black bg-white p-6 shadow-lg">
              <CardContent className="p-0">
                <h3 className="text-lg font-semibold text-neutral">{it.q}</h3>
                <p className="mt-2 text-muted-foreground">{it.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

