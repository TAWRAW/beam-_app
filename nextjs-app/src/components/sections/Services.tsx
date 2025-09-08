export default function Services() {
  return (
    <section className="section bg-gray-50">
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
            <li key={s} className="card p-4">✅ {s}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

