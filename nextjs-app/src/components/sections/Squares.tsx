export default function Squares() {
  return (
    <section className="section bg-gray-50">
      <div className="container">
        <h2 className="h2 text-center font-semibold text-neutral">De nombreux copropriétaires nous contactent pour ces raisons :</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          {[
            ['❌ Syndic en sous-effectif', '"Notre syndic est en sous-effectif, personne ne gère notre immeuble."'],
            ['❌ Vente de portefeuille', '"On nous annonce la vente du portefeuille et on ne sait pas qui va nous gérer."'],
            ['❌ Absence de réponse', '"Nos demandes restent sans réponse pendant des semaines."'],
            ['❌ Opacité financière', '"Les comptes sont opaques, on ne sait pas où va notre argent."'],
          ].map(([title, p]) => (
            <Square key={title} title={title} p={p} />
          ))}
        </div>

        <h2 className="h2 mt-16 text-center font-semibold text-neutral">Avec Beamô, c'est différent :</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
          {[
            ['Stabilité', '✅ Un syndic stable et local qui ne vend pas ses copropriétés.'],
            ['Implication', '✅ Un interlocuteur unique, réactif et impliqué.'],
            ['Transparence', '✅ Un suivi transparent et digitalisé, pour voir en temps réel ce qui est fait.'],
            ['Réactivité', '✅ Des réponses garanties sous 48h ouvrées.'],
          ].map(([title, p]) => (
            <Square key={title} title={title} p={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Square({ title, p }: { title: string; p: string }) {
  return (
    <div className="card relative p-6 transition-transform hover:-translate-y-2">
      <h3 className="text-lg font-semibold text-neutral">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{p}</p>
    </div>
  )
}
