import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { loadCondoSuppliers } from '@/lib/venator/estale-os'

// GET /api/venator/estale/suppliers?copro_estale_id=... → { suppliers } (lecture seule, sélecteur d'OS).
export async function GET(req: NextRequest) {
  const auth = await requireVenatorRole('gestionnaire')
  if (!auth.ok) return auth.response
  const coproEstaleId = req.nextUrl.searchParams.get('copro_estale_id')
  if (!coproEstaleId) return NextResponse.json({ error: 'copro_estale_id requis' }, { status: 400 })
  try {
    const suppliers = await loadCondoSuppliers(coproEstaleId)
    return NextResponse.json({ suppliers })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur Estale' }, { status: 502 })
  }
}
