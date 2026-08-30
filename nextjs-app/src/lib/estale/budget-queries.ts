// Suivi budgétaire Estale — lecture seule.
//
// Tout est natif dans l'API : le budget ordinaire expose voté (`amount`),
// consommé réel (`amountUsed`, bouge à chaque facture saisie), appelé
// (`amountCalled`) et encaissé (`amountPaid`). Le champ `virtual`
// (BudgetKeyOrdinaryVirtual) donne la même chose poste par poste, avec le
// N-1 en regard. Aucun calcul comptable côté client : on agrège et on affiche.
//
// Pièges vérifiés au test réel du 29/08/2026 (copro 00010) :
//   - `balance.current` / `voted.current` peuvent être null → coalescer à 0 ;
//   - un compte apparaît en PLUSIEURS lignes de `virtual` (une par clé de
//     répartition, ex. Nettoyage 611 × 3 clés) → agréger par account.id avant
//     tout affichage, sinon les pourcentages par poste sont faux ;
//   - `condo.accounting` sans argument = l'exercice COURANT (isCurrent) ;
//     certaines copros récentes peuvent ne pas en avoir → nullable partout.

import { estaleGraphQL } from '../estale-api'

// --- Types ----------------------------------------------------------------

export interface BudgetGlobal {
  /** Budget voté (€). */
  vote: number
  /** Consommé réel — factures saisies en comptabilité (€). */
  consomme: number
  /** Appelé auprès des copropriétaires (€). */
  appele: number
  /** Effectivement encaissé (€). */
  encaisse: number
}

export interface BudgetOverviewRow {
  condoID: string
  nom: string
  reference: string
  /** [début, fin] de l'exercice courant, format YYYY-MM-DD. Null si pas d'exercice. */
  periode: [string, string] | null
  nomBudget: string | null
  global: BudgetGlobal | null
}

export interface BudgetPoste {
  accountID: string
  nom: string
  nomenclature: string
  vote: number
  consomme: number
  voteN1: number
  consommeN1: number
}

export interface AutreBudget {
  id: string
  nom: string
  categorie: string
  vote: number
  appele: number
  encaisse: number
  periode: [string, string] | null
}

export interface BudgetDetail {
  condoID: string
  nom: string
  reference: string
  periode: [string, string] | null
  nomBudget: string | null
  global: BudgetGlobal | null
  postes: BudgetPoste[]
  /** Travaux votés, ALUR, avances… — même interface Budget, suivis à côté. */
  autresBudgets: AutreBudget[]
}

// --- Requêtes --------------------------------------------------------------

interface RawBudgetOrdinary {
  name: string
  amount: number
  amountUsed: number
  amountCalled: number
  amountPaid: number
}

interface RawAccountingOverview {
  period: [string, string]
  budgetOrdinary: RawBudgetOrdinary | null
}

/**
 * Vue d'ensemble : l'exercice courant et le budget ordinaire de chaque copro,
 * en UNE requête GraphQL (l'API résout accounting/budget par copro).
 */
export async function getBudgetsOverview(): Promise<BudgetOverviewRow[]> {
  const query = /* GraphQL */ `
    query BudgetsOverview {
      me {
        establishment {
          condos(archived: false) {
            id
            name
            reference
            accounting {
              period
              budgetOrdinary {
                name
                amount
                amountUsed
                amountCalled
                amountPaid
              }
            }
          }
        }
      }
    }
  `
  const data = await estaleGraphQL<{
    me: {
      establishment: {
        condos: Array<{
          id: string
          name: string
          reference: string
          accounting: RawAccountingOverview | null
        }>
      }
    }
  }>(query)

  return data.me.establishment.condos.map((c) => ({
    condoID: c.id,
    nom: c.name,
    reference: c.reference,
    periode: c.accounting?.period ?? null,
    nomBudget: c.accounting?.budgetOrdinary?.name ?? null,
    global: c.accounting?.budgetOrdinary
      ? {
          vote: c.accounting.budgetOrdinary.amount ?? 0,
          consomme: c.accounting.budgetOrdinary.amountUsed ?? 0,
          appele: c.accounting.budgetOrdinary.amountCalled ?? 0,
          encaisse: c.accounting.budgetOrdinary.amountPaid ?? 0,
        }
      : null,
  }))
}

/**
 * Détail d'une copro : postes du budget ordinaire (agrégés par compte) et
 * autres budgets de l'exercice (travaux, ALUR, avances).
 *
 * `exercice: 'precedent'` vise l'exercice antérieur via `accounting.prev` —
 * c'est celui qu'on présente au conseil syndical pour une clôture de comptes
 * (l'exercice courant n'est pas terminé, ses chiffres ne se clôturent pas).
 */
export async function getBudgetDetail(
  condoID: string,
  exercice: 'courant' | 'precedent' = 'courant',
): Promise<BudgetDetail> {
  const accountingFields = /* GraphQL */ `
    period
    budgetOrdinary {
      name
      amount
      amountUsed
      amountCalled
      amountPaid
      virtual {
        account {
          id
          name
          nomenclature
        }
        voted {
          current
          previousN1
        }
        balance {
          current
          previousN1
        }
      }
    }
    budgets {
      id
      name
      category
      period
      amount
      amountCalled
      amountPaid
    }
  `
  const query = /* GraphQL */ `
    query BudgetDetail($id: ID!) {
      condo(id: $id) {
        id
        name
        reference
        accounting {
          ${exercice === 'precedent' ? `prev { ${accountingFields} }` : accountingFields}
        }
      }
    }
  `
  interface RawAccountingDetail {
    period: [string, string]
    budgetOrdinary: (RawBudgetOrdinary & {
      virtual: Array<{
        account: { id: string; name: string; nomenclature: string }
        voted: { current: number | null; previousN1: number | null }
        balance: { current: number | null; previousN1: number | null }
      }>
    }) | null
    budgets: Array<{
      id: string
      name: string
      category: string
      period: [string, string] | null
      amount: number
      amountCalled: number
      amountPaid: number
    }>
  }

  const data = await estaleGraphQL<{
    condo: {
      id: string
      name: string
      reference: string
      accounting: (RawAccountingDetail & { prev?: RawAccountingDetail | null }) | null
    }
  }>(query, { id: condoID })

  const condo = data.condo
  const compta: RawAccountingDetail | null =
    exercice === 'precedent' ? condo.accounting?.prev ?? null : condo.accounting ?? null
  const ordinaire = compta?.budgetOrdinary ?? null

  // Agrégation par compte : une ligne `virtual` par clé de répartition,
  // un même poste (611 Nettoyage…) peut donc apparaître plusieurs fois.
  const parCompte = new Map<string, BudgetPoste>()
  for (const v of ordinaire?.virtual ?? []) {
    const existant = parCompte.get(v.account.id)
    const vote = v.voted.current ?? 0
    const consomme = v.balance.current ?? 0
    const voteN1 = v.voted.previousN1 ?? 0
    const consommeN1 = v.balance.previousN1 ?? 0
    if (existant) {
      existant.vote += vote
      existant.consomme += consomme
      existant.voteN1 += voteN1
      existant.consommeN1 += consommeN1
    } else {
      parCompte.set(v.account.id, {
        accountID: v.account.id,
        nom: v.account.name,
        nomenclature: v.account.nomenclature,
        vote,
        consomme,
        voteN1,
        consommeN1,
      })
    }
  }

  const postes = Array.from(parCompte.values()).sort((a, b) => b.vote - a.vote)

  const autresBudgets: AutreBudget[] = (compta?.budgets ?? [])
    .filter((b) => b && b.category !== 'GENERAL')
    .map((b) => ({
      id: b.id,
      nom: b.name,
      categorie: b.category,
      vote: b.amount ?? 0,
      appele: b.amountCalled ?? 0,
      encaisse: b.amountPaid ?? 0,
      periode: b.period ?? null,
    }))

  return {
    condoID: condo.id,
    nom: condo.name,
    reference: condo.reference,
    periode: compta?.period ?? null,
    nomBudget: ordinaire?.name ?? null,
    global: ordinaire
      ? {
          vote: ordinaire.amount ?? 0,
          consomme: ordinaire.amountUsed ?? 0,
          appele: ordinaire.amountCalled ?? 0,
          encaisse: ordinaire.amountPaid ?? 0,
        }
      : null,
    postes,
    autresBudgets,
  }
}
