export const metadata = {
  title: 'Offres de Syndic de Copropriété à Vernon, Evreux, Les Andelys | Beamô',
  description:
    'Découvrez nos offres de syndic de copropriété à Vernon, Evreux et Les Andelys. Services transparents et réactifs adaptés à vos besoins. Changez facilement de syndic.',
  alternates: { canonical: '/offres' },
}

export default function OffresPage() {
  return (
    <main className="bg-primary">
      <section className="section">
        <div className="container">
          <header className="text-center">
            <h1 className="h1">Nos Offres</h1>
            <p className="mt-2 text-gray-700">Découvrez nos solutions adaptées aux copropriétés.</p>
          </header>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <OffreCard id="syndic" title="Offre Standard" desc="Gestion classique de votre copropriété avec transparence et efficacité. Tous les services essentiels d'un syndic professionnel, avec notre engagement de réactivité." cta="Découvrir" />
            <OffreCard id="conseil" title="Offre Hybride" desc="Un modèle participatif avec le conseil syndical pour réduire les coûts. Vous êtes impliqués dans la gestion, nous vous apportons notre expertise technique." cta="En savoir plus" />
            <OffreCard id="gestion" title="Offre Clos-Masure" desc="En cours de développement..." cta={null} showLoading />
          </div>
        </div>
      </section>
    </main>
  )
}

function OffreCard({ id, title, desc, cta, showLoading }: { id: string; title: string; desc: string; cta: string | null; showLoading?: boolean }) {
  return (
    <div id={id} className="card p-8">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-gray-700">{desc}</p>
      {showLoading && (
        <div className="mt-6">
          <div className="emoji-wave mb-2 flex gap-2 text-2xl"><span>🏢</span><span>🏠</span><span>🏗️</span><span>🏤</span><span>🏬</span><span>🏘️</span><span>🏛️</span><span>🏣</span></div>
          <div className="loading-bar"><div className="bar" /></div>
        </div>
      )}
      {cta && <a className="mt-6 btn" href="#">{cta}</a>}
    </div>
  )
}
