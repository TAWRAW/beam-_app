'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Copro } from '@/lib/venator/types'

export default function CoprosIndexPage() {
  const [copros, setCopros] = useState<Copro[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCopros = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/copros')
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const { copros }: { copros: Copro[] } = await res.json()
      setCopros(copros ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
      setCopros([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCopros()
  }, [loadCopros])

  async function handleSync() {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/copros/sync', { method: 'POST' })
      if (!res.ok) throw new Error(`Erreur sync ${res.status}`)
      await loadCopros()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white p-3 flex items-center justify-between gap-3">
        <h1 className="font-bold text-lg">Copropriétés</h1>
        <Button
          type="button"
          variant="outline"
          onClick={handleSync}
          disabled={syncing}
          className="rounded-full border-2 border-black bg-white font-semibold"
        >
          {syncing ? 'Sync…' : '⟳ Sync copros'}
        </Button>
      </div>

      {error && (
        <div className="border-2 border-red-600 rounded-2xl bg-white p-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-neutral-600">Chargement…</p>
      ) : copros.length === 0 ? (
        <p className="text-sm text-neutral-600">
          Aucune copropriété. Cliquez sur « ⟳ Sync copros » pour importer depuis Estale.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {copros.map((c) => (
            <Link
              key={c.id}
              href={`/apps/venator/copros/${c.id}` as any}
              className="block border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] bg-white p-3 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] transition"
            >
              {c.reference ? (
                <>
                  <p className="text-xs font-semibold text-neutral-500">{c.reference}</p>
                  <p className="font-bold text-sm">{c.nom}</p>
                </>
              ) : (
                <p className="font-bold text-sm">{c.nom}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
