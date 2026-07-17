'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSWRConfig } from 'swr'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCopros } from '@/lib/venator/useVenator'

function CoprosSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 rounded-2xl border-2 border-black bg-neutral-200 animate-pulse" />
      ))}
    </div>
  )
}

export default function CoprosIndexPage() {
  const { mutate } = useSWRConfig()
  const { data, error: swrError, isLoading } = useCopros()
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copros = data?.copros ?? []

  async function handleSync() {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/copros/sync', { method: 'POST' })
      if (!res.ok) throw new Error(`Erreur sync ${res.status}`)
      await mutate('/api/venator/copros')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  const displayError = error ?? (swrError ? 'Erreur de chargement' : null)

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
          {syncing ? (
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin')} />
              Sync…
            </span>
          ) : (
            '⟳ Sync copros'
          )}
        </Button>
      </div>

      {displayError && (
        <div className="border-2 border-red-600 rounded-2xl bg-white p-3 text-sm font-semibold text-red-600">
          {displayError}
        </div>
      )}

      {isLoading ? (
        <CoprosSkeleton />
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
