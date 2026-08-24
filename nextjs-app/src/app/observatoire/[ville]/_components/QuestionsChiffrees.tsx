import { formatNombre, libelleTrimestre, type MarcheCommune } from '@/lib/marche-copro'

/**
 * Questions que les gens tapent réellement (« combien de copropriétés à X »,
 * « quelle est la plus grande copropriété de X »), répondues avec les chiffres de
 * la page. Rendu visible + FAQPage en données structurées : les deux doivent dire
 * exactement la même chose, sinon Google considère le balisage comme trompeur.
 */
export default function QuestionsChiffrees({
  m,
  aVille,
  deVille,
  nom,
}: {
  m: MarcheCommune
  aVille: string
  deVille: string
  nom: string
}) {
  const p = m.petites_coproprietes
  const plusGrande = m.top[0]
  const items: Array<{ q: string; a: string }> = []

  items.push({
    q: `Combien y a-t-il de copropriétés ${aVille} ?`,
    a: `${formatNombre(m.total.coproprietes)} copropriétés sont immatriculées ${aVille} au registre national, pour ${formatNombre(m.total.lots)} lots au total, dont ${formatNombre(m.total.lots_habitation)} lots d’habitation. Relevé du ${libelleTrimestre(m.trimestre.actuel)}.`,
  })

  items.push({
    q: `Quelle est la taille d’une copropriété ${aVille} ?`,
    a: `La copropriété médiane ${aVille} compte ${m.total.taille_mediane} lots : une sur deux est plus petite. La moyenne, de ${m.total.taille_moyenne} lots, est plus élevée parce qu’elle est tirée vers le haut par les grandes résidences. ${p.part} % du parc fait moins de ${p.seuil_lots} lots.`,
  })

  items.push({
    q: `Combien de copropriétés ${aVille} ont un syndic professionnel ?`,
    a: `${formatNombre(m.syndics.professionnel)} copropriétés déclarent un syndic professionnel au registre, ${formatNombre(m.syndics.benevole)} un syndic bénévole, et ${formatNombre(m.syndics.non_declare)} n’ont aucun syndic déclaré. Sur les seules copropriétés de moins de ${p.seuil_lots} lots, la part avec syndic professionnel tombe à ${p.part_avec_syndic_professionnel} %. Attention : une case vide au registre ne prouve pas l’absence de syndic, le registre étant déclaratif et souvent en retard.`,
  })

  if (plusGrande?.nom) {
    items.push({
      q: `Quelle est la plus grande copropriété ${deVille} ?`,
      a: `${plusGrande.nom}${plusGrande.adresse ? `, ${plusGrande.adresse}` : ''}, avec ${formatNombre(plusGrande.lots)} lots${plusGrande.syndic_nom ? `, gérée par ${plusGrande.syndic_nom}` : ''}.`,
    })
  }

  if (m.evolution) {
    const { delta, delta_pct } = m.evolution
    items.push({
      q: `Le nombre de copropriétés augmente-t-il ${aVille} ?`,
      a:
        delta === 0
          ? `Le parc immatriculé ${aVille} est stable : ${formatNombre(m.total.coproprietes)} copropriétés au ${libelleTrimestre(m.trimestre.actuel)}, autant qu’au ${libelleTrimestre(m.trimestre.compare)}.`
          : `Le parc immatriculé est passé de ${formatNombre(m.evolution.coproprietes_avant)} à ${formatNombre(m.total.coproprietes)} copropriétés entre le ${libelleTrimestre(m.trimestre.compare)} et le ${libelleTrimestre(m.trimestre.actuel)}, soit ${delta > 0 ? '+' : ''}${delta}${delta_pct !== null ? ` (${delta_pct > 0 ? '+' : ''}${String(delta_pct).replace('.', ',')} %)` : ''}. Une immatriculation nouvelle correspond souvent à une copropriété ancienne qui se déclare, pas à un immeuble neuf.`,
    })
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }

  return (
    <section className="border-b-2 border-[#0A0A0A]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
        }}
      />
      <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
        <h2 className="text-2xl font-black md:text-3xl">
          Les questions qu&apos;on nous pose sur le parc {deVille}
        </h2>
        <dl className="mt-8 space-y-5">
          {items.map((it) => (
            <div
              key={it.q}
              className="border-2 border-[#0A0A0A] bg-white p-5 shadow-[4px_4px_0_#0A0A0A]"
            >
              <dt className="text-base font-bold">{it.q}</dt>
              <dd className="mt-2 leading-relaxed text-[#5b5b52]">{it.a}</dd>
            </div>
          ))}
        </dl>
        <p className="sr-only">
          Données du registre national des copropriétés pour {nom}, relevé du{' '}
          {libelleTrimestre(m.trimestre.actuel)}.
        </p>
      </div>
    </section>
  )
}
