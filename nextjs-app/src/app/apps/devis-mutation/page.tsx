import { Suspense } from 'react'
import Link from 'next/link'
import { Settings2 } from 'lucide-react'
import { getOpenSales } from '@/lib/estale/sale-queries'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

async function SalesList() {
  let sales
  try {
    sales = await getOpenSales()
  } catch (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/5 p-4 text-sm text-destructive">
        Impossible de récupérer les ventes depuis Estale :{' '}
        {error instanceof Error ? error.message : 'erreur inconnue'}
      </div>
    )
  }

  if (sales.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">Aucune vente ouverte dans Estale.</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Crée une vente dans Estale (Mutations → Nouvelle vente), puis reviens ici pour générer le devis correspondant.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {sales.map((s) => {
        const sellerNames = s.owners.map((o) => o.fullname).join(', ') || '—'
        const scheduledDate = new Date(s.scheduledDate).toLocaleDateString('fr-FR')
        const href = `/apps/devis-mutation/nouveau?condoId=${s.condoID}&saleId=${s.id}`

        return (
          <Link key={s.id} href={href as any} className="block">
            <Card className="p-4 transition hover:bg-accent">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-medium">Vente {s.reference}</span>
                    <Badge variant={s.isPartial ? 'secondary' : 'outline'}>
                      {s.isPartial ? 'partielle' : 'complète'}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {s.condoName} <span className="text-xs">({s.condoReference})</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sellerNames} — signature prévue le {scheduledDate}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-muted-foreground">
                  {s.nbLot} lot{s.nbLot > 1 ? 's' : ''}
                  <br />
                  {s.nbOwner} vendeur{s.nbOwner > 1 ? 's' : ''}
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

export default function DevisMutationPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Devis mutation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Génère un devis signé (pré-état daté, état daté ou ordre de virement) pour une vente en cours dans Estale.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={'/apps/devis-mutation/reglages' as any}>
            <Settings2 className="mr-2 h-4 w-4" />
            Tarifs
          </Link>
        </Button>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement des ventes Estale…</p>}>
        <SalesList />
      </Suspense>
    </div>
  )
}
