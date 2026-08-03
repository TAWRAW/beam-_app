'use client'

import { useState } from 'react'
import { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { keys, useChecklist } from '@/lib/venator/useVenator'
import type { Checklist, ChecklistItem } from '@/lib/venator/types'
import { venatorButtonNeutral, venatorMicroLabel } from './venator-ui-classes'

type ChecklistEtat = { checklist: Checklist; items: ChecklistItem[]; progression: number }

function formatDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('fr-FR')
}

function ChecklistSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--venator-radius-lg)] bg-venator-surface p-3">
      <div className="h-4 w-24 rounded bg-venator-surface-hover animate-pulse" />
      <div className="h-2 rounded-full bg-venator-surface-hover animate-pulse" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-4 w-full rounded bg-venator-surface-hover animate-pulse" />
      ))}
    </div>
  )
}

export default function ChecklistPanel({ coproId }: { coproId: string }) {
  const key = keys.checklist(coproId)
  const { data, isLoading } = useChecklist(coproId)
  const etat = (data?.etat ?? null) as ChecklistEtat | null
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)

  async function handleStart() {
    if (starting) return
    setStarting(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copro_id: coproId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      await mutate(key)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setStarting(false)
    }
  }

  // Cochage optimiste : barré + % recalculé immédiatement, rollback si l'appel échoue.
  async function handleToggle(itemId: string, fait: boolean) {
    if (!etat || pendingItemId) return
    setPendingItemId(itemId)
    setError(null)

    const previous = data
    const items = etat.items.map((i) => (i.id === itemId ? { ...i, fait, fait_at: fait ? new Date().toISOString() : null } : i))
    const progression = items.length ? Math.round((items.filter((i) => i.fait).length / items.length) * 100) : 0
    mutate(key, { etat: { ...etat, items, progression } }, { revalidate: false })

    try {
      const res = await fetch(`/api/venator/checklists/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fait }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Erreur ${res.status}`)
      }
      await mutate(key)
    } catch (e) {
      mutate(key, previous, { revalidate: true })
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setPendingItemId(null)
    }
  }

  if (isLoading) {
    return <ChecklistSkeleton />
  }

  if (!etat) {
    return (
      <div className="flex flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-5">
        <h2 className={venatorMicroLabel}>Checklist</h2>
        {error && <p className="text-xs font-medium text-venator-danger">{error}</p>}
        <Button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className={cn(venatorButtonNeutral, 'h-auto whitespace-normal py-2 text-[12px] leading-snug')}
        >
          {starting ? 'Démarrage…' : 'Démarrer la checklist nouvelle copro'}
        </Button>
      </div>
    )
  }

  const categories: string[] = []
  const byCategorie = new Map<string, ChecklistItem[]>()
  for (const item of etat.items) {
    if (!byCategorie.has(item.categorie)) {
      byCategorie.set(item.categorie, [])
      categories.push(item.categorie)
    }
    byCategorie.get(item.categorie)!.push(item)
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-venator-fg">Checklist</h2>
        <span className="font-mono text-xs tabular-nums text-venator-fg-muted">{etat.progression}%</span>
      </div>
      <Progress
        value={etat.progression}
        className="h-1.5 bg-venator-surface-hover [&>div]:bg-venator-accent"
      />

      {error && <p className="text-xs font-medium text-venator-danger">{error}</p>}

      <div className="flex flex-col gap-3">
        {categories.map((categorie) => (
          <div key={categorie} className="flex flex-col gap-1.5">
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-venator-fg-muted">{categorie}</h3>
            <ul className="flex flex-col gap-1">
              {byCategorie.get(categorie)!.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`checklist-item-${item.id}`}
                    checked={item.fait}
                    disabled={pendingItemId === item.id}
                    onCheckedChange={(checked) => handleToggle(item.id, checked === true)}
                    className="mt-0.5 border-venator-border-strong data-[state=checked]:bg-venator-accent data-[state=checked]:border-venator-accent data-[state=checked]:text-venator-accent-foreground"
                  />
                  <label htmlFor={`checklist-item-${item.id}`} className="min-w-0 flex-1 cursor-pointer text-sm">
                    <span className={cn(item.fait ? 'text-venator-fg-muted line-through' : 'text-venator-fg')}>
                      {item.libelle}
                    </span>
                    {item.fait && item.fait_at && (
                      <span className="block font-mono text-[10px] text-venator-fg-muted">{formatDate(item.fait_at)}</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
