import type { TrancheMarche } from '@/lib/marche-copro'

/**
 * Croisement taille × syndic déclaré, une barre empilée par tranche de taille.
 * C'est la pièce centrale de la page : on y voit les syndics professionnels
 * quitter progressivement les copropriétés à mesure qu'elles rapetissent.
 */
export default function BarreTranches({ tranches }: { tranches: TrancheMarche[] }) {
  const nonVides = tranches.filter((t) => t.nb > 0)

  return (
    <div className="space-y-5">
      {nonVides.map((t) => {
        const pro = Math.round((t.syndic.professionnel / t.nb) * 100)
        const ben = Math.round((t.syndic.benevole / t.nb) * 100)
        const non = 100 - pro - ben

        return (
          <div key={t.cle}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="text-base font-bold text-[#0A0A0A]">{t.libelle}</h3>
              <p className="text-sm text-[#5b5b52]">
                <span className="font-bold text-[#0A0A0A]">{t.nb}</span> copropriété
                {t.nb > 1 ? 's' : ''} · {t.part}&nbsp;% du parc
              </p>
            </div>

            <div
              className="flex h-11 w-full overflow-hidden border-2 border-[#0A0A0A] bg-white"
              role="img"
              aria-label={`${t.libelle} : ${t.syndic.professionnel} avec syndic professionnel, ${t.syndic.benevole} avec syndic bénévole, ${t.syndic.non_declare} sans syndic déclaré`}
            >
              {t.syndic.professionnel > 0 && (
                <div
                  className="flex items-center justify-center bg-[#0F4D0F] text-xs font-bold text-white"
                  style={{ width: `${pro}%` }}
                >
                  {pro >= 8 ? `${pro} %` : ''}
                </div>
              )}
              {t.syndic.benevole > 0 && (
                <div
                  className="flex items-center justify-center border-l-2 border-[#0A0A0A] bg-[#FFC300] text-xs font-bold text-[#0A0A0A]"
                  style={{ width: `${ben}%` }}
                >
                  {ben >= 8 ? `${ben} %` : ''}
                </div>
              )}
              {t.syndic.non_declare > 0 && (
                <div
                  className="flex flex-1 items-center justify-center border-l-2 border-[#0A0A0A] text-xs font-bold text-[#5b5b52]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(10,10,10,0.12) 5px, rgba(10,10,10,0.12) 10px)',
                  }}
                >
                  {non >= 8 ? `${non} %` : ''}
                </div>
              )}
            </div>

            <p className="mt-1.5 text-xs text-[#5b5b52]">
              {t.syndic.professionnel} professionnel{t.syndic.professionnel > 1 ? 's' : ''} ·{' '}
              {t.syndic.benevole} bénévole{t.syndic.benevole > 1 ? 's' : ''} ·{' '}
              {t.syndic.non_declare} non déclaré{t.syndic.non_declare > 1 ? 's' : ''} ·{' '}
              {t.lots.toLocaleString('fr-FR')} lots au total
            </p>
          </div>
        )
      })}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t-2 border-[#0A0A0A] pt-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 border-2 border-[#0A0A0A] bg-[#0F4D0F]" />
          Syndic professionnel
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 border-2 border-[#0A0A0A] bg-[#FFC300]" />
          Syndic bénévole
        </span>
        <span className="flex items-center gap-2">
          <span
            className="inline-block h-3.5 w-3.5 border-2 border-[#0A0A0A] bg-white"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(10,10,10,0.2) 3px, rgba(10,10,10,0.2) 6px)',
            }}
          />
          Syndic non déclaré au registre
        </span>
      </div>
    </div>
  )
}
