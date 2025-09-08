type FAQItem = { q: string; a: string }

export default function FAQ({ items, id = 'faq' }: { items: FAQItem[]; id?: string }) {
  return (
    <section id={id} className="section">
      <div className="container">
        <h2 className="h2 text-center font-semibold text-neutral">Questions fréquentes</h2>
        <div className="mt-8 space-y-4">
          {items.map((it, idx) => (
            <div key={idx} className="card p-6">
              <h3 className="text-lg font-semibold text-neutral">{it.q}</h3>
              <p className="mt-2 text-gray-700">{it.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

