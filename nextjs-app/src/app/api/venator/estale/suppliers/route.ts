import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { loadCondoSuppliers, loadEstablishmentSuppliers } from '@/lib/venator/estale-os'

// GET /api/venator/estale/suppliers?copro_estale_id=... (lecture seule, sélecteur d'OS).
// → { suppliers, cabinetSuppliers } : fournisseurs de la copro, puis le reste du cabinet
//   (dédupliqués par id fournisseur) pour pouvoir adresser un OS à n'importe quel prestataire.
export async function GET(req: NextRequest) {
  const auth = await requireVenatorRole('gestionnaire')
  if (!auth.ok) return auth.response
  const coproEstaleId = req.nextUrl.searchParams.get('copro_estale_id')
  if (!coproEstaleId) return NextResponse.json({ error: 'copro_estale_id requis' }, { status: 400 })
  try {
    const [suppliers, allSuppliers] = await Promise.all([
      loadCondoSuppliers(coproEstaleId),
      loadEstablishmentSuppliers(),
    ])
    const condoIds = new Set(suppliers.map((s) => s.id))
    const cabinetSuppliers = allSuppliers.filter((s) => !condoIds.has(s.id))
    return NextResponse.json({ suppliers, cabinetSuppliers })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur Estale' }, { status: 502 })
  }
}
