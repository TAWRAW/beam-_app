import { Metadata } from 'next'
import RapportBudgetClient from './RapportBudgetClient'

// Rapport budgétaire Beamô — présentation au conseil syndical.
// Volontairement HORS de /apps : pas de sidebar, la page EST le document A4
// (impression via Cmd+P → PDF). Les données restent protégées : l'API
// /api/estale/budgets exige une session admin, la page ne fait que l'appeler.

export const metadata: Metadata = {
  title: 'Rapport budgétaire | Beamô',
  robots: { index: false, follow: false },
}

export default function RapportBudgetPage() {
  return <RapportBudgetClient />
}
