// src/lib/venator/services/copros-service.ts — cache léger des copros Estale (jamais de données copropriétaires).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Copro } from '../types'

type FetchCondos = () => Promise<{ condos: { id: string; name: string; reference?: string | null }[] }>

export async function syncCopros(db: SupabaseClient, fetchCondos: FetchCondos): Promise<{ created: number; total: number }> {
  const { condos } = await fetchCondos()
  let created = 0
  for (const c of condos) {
    const { data: existing } = await db.from('venator_copros').select('*').eq('estale_id', c.id).maybeSingle()
    if (existing) {
      await db.from('venator_copros').update({ nom: c.name, reference: c.reference ?? existing.reference }).eq('id', existing.id)
    } else {
      await db.from('venator_copros').insert({ estale_id: c.id, nom: c.name, reference: c.reference ?? '' })
      created++
    }
  }
  return { created, total: condos.length }
}

export async function listerCopros(db: SupabaseClient): Promise<Copro[]> {
  const { data } = await db.from('venator_copros').select('*').order('reference')
  return data ?? []
}
