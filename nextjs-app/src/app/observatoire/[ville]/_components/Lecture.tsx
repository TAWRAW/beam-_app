import { formatNombre, type MarcheCommune } from '@/lib/marche-copro'

/**
 * Lecture du relevé : trois constats déduits des chiffres de la commune, pas un
 * texte à trous. Chaque phrase n'apparaît que si la donnée qui la justifie est là,
 * et cite le chiffre qui la fonde — deux communes voisines ne racontent donc pas
 * la même histoire.
 */

function concentration(m: MarcheCommune): string | null {
  const grandes = m.tranches.filter((t) => t.min >= 50)
  const nbGrandes = grandes.reduce((a, t) => a + t.nb, 0)
  const lotsGrandes = grandes.reduce((a, t) => a + t.lots, 0)
  if (nbGrandes === 0 || m.total.lots === 0) return null
  const partCopros = Math.round((nbGrandes / m.total.coproprietes) * 100)
  const partLots = Math.round((lotsGrandes / m.total.lots) * 100)
  if (partLots - partCopros < 15) return null
  return `Le parc est très inégal : les ${formatNombre(nbGrandes)} copropriétés de 50 lots et plus ne pèsent que ${partCopros} % des immeubles, mais ${partLots} % des lots. Autrement dit, la grande majorité des copropriétés sont petites, et la grande majorité des habitants vivent dans les grandes.`
}

function agePark(m: MarcheCommune): string | null {
  const connues = m.construction.filter((c) => c.periode !== 'Non renseignée')
  if (connues.length === 0) return null
  const total = connues.reduce((a, c) => a + c.nb, 0)
  const dominante = [...connues].sort((a, b) => b.nb - a.nb)[0]
  const part = Math.round((dominante.nb / total) * 100)
  if (part < 30) return null

  const enjeux: Record<string, string> = {
    'Avant 1949':
      'ces immeubles anciens concentrent les sujets de façade, de toiture et de réseaux, et sont rarement isolés',
    'De 1949 à 1974':
      'cette génération d’après-guerre est celle des chaufferies collectives et des passoires thermiques, au cœur des obligations de rénovation énergétique',
    'De 1975 à 2000':
      'ces immeubles arrivent à l’âge du renouvellement des équipements collectifs, ascenseurs et ventilation en tête',
    'À partir de 2001':
      'ce parc récent demande surtout de la rigueur d’entretien courant, avant que les premières grosses échéances n’arrivent',
  }
  const enjeu = enjeux[dominante.periode]
  if (!enjeu) return null

  const inconnues = m.construction.find((c) => c.periode === 'Non renseignée')
  const reserve =
    inconnues && inconnues.part >= 20
      ? ` La période de construction n’est pas renseignée pour ${inconnues.part} % du parc, ce qui invite à lire ces proportions avec prudence.`
      : ''

  return `Parmi les copropriétés dont la date de construction est connue, ${part} % relèvent de la période « ${dominante.periode.toLowerCase()} » : ${enjeu}.${reserve}`
}

function couverture(m: MarcheCommune): string {
  const p = m.petites_coproprietes
  const global = Math.round((m.syndics.professionnel / m.total.coproprietes) * 100)
  const ecart = global - p.part_avec_syndic_professionnel

  if (ecart >= 10) {
    return `${global} % des copropriétés de la commune déclarent un syndic professionnel, mais seulement ${p.part_avec_syndic_professionnel} % de celles de moins de ${p.seuil_lots} lots. L’écart de ${ecart} points dit tout : plus l’immeuble est petit, moins il trouve un professionnel qui accepte de le gérer.`
  }
  if (p.part_avec_syndic_professionnel <= 35) {
    return `Seules ${p.part_avec_syndic_professionnel} % des copropriétés de moins de ${p.seuil_lots} lots déclarent un syndic professionnel. Le reste est géré bénévolement, ou n’a jamais mis sa déclaration à jour.`
  }
  // Pas de comparaison aux communes voisines ici : la page ne dispose que de ses
  // propres chiffres, une telle affirmation ne serait pas vérifiable.
  const sansPro = p.nb - p.avec_syndic_professionnel
  return `${p.part_avec_syndic_professionnel} % des copropriétés de moins de ${p.seuil_lots} lots déclarent un syndic professionnel, une couverture inhabituellement large. Il reste tout de même ${formatNombre(sansPro)} petites copropriétés sans professionnel déclaré.`
}

export default function Lecture({ m, deVille }: { m: MarcheCommune; deVille: string }) {
  const constats = [couverture(m), concentration(m), agePark(m)].filter(
    (x): x is string => x !== null,
  )
  if (constats.length === 0) return null

  return (
    <section className="border-b-2 border-[#0A0A0A]">
      <div className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
        <h2 className="text-2xl font-black md:text-3xl">Ce que dit ce relevé {deVille}</h2>
        <div className="mt-6 max-w-3xl space-y-4 text-lg leading-relaxed">
          {constats.map((c) => (
            <p key={c.slice(0, 40)}>{c}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
