// src/lib/venator/services/checklist-service.ts — onboarding nouvelle copro.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Checklist, ChecklistItem } from '../types'
import { CHECKLIST_NOUVELLE_COPRO } from '../gabarits'
import { logJournal } from './journal-service'
import { VenatorError } from './errors'

export async function creerChecklist(db: SupabaseClient, copro_id: string): Promise<Checklist> {
  const { data: existing } = await db.from('venator_checklists').select('*').eq('copro_id', copro_id).maybeSingle()
  if (existing) throw new VenatorError('conflict', 'Checklist déjà créée pour cette copro')
  const { data: checklist, error } = await db.from('venator_checklists').insert({ copro_id }).select().single()
  if (error || !checklist) throw new VenatorError('invalid', error?.message ?? 'création impossible')
  await db.from('venator_checklist_items').insert(
    CHECKLIST_NOUVELLE_COPRO.map((it, i) => ({ checklist_id: checklist.id, ordre: i + 1, libelle: it.libelle, categorie: it.categorie, auto_check_key: it.auto_check_key ?? null })),
  )
  return checklist
}

export async function etatChecklist(db: SupabaseClient, copro_id: string): Promise<{ checklist: Checklist; items: ChecklistItem[]; progression: number } | null> {
  const { data: checklist } = await db.from('venator_checklists').select('*').eq('copro_id', copro_id).maybeSingle()
  if (!checklist) return null
  const { data: items } = await db.from('venator_checklist_items').select('*').eq('checklist_id', checklist.id).order('ordre')
  const all = items ?? []
  const progression = all.length ? Math.round((all.filter(i => i.fait).length / all.length) * 100) : 0
  return { checklist, items: all, progression }
}

export async function cocherItem(db: SupabaseClient, itemId: string, fait: boolean): Promise<ChecklistItem> {
  const { data, error } = await db.from('venator_checklist_items')
    .update({ fait, fait_at: fait ? new Date().toISOString() : null }).eq('id', itemId).select().single()
  if (error || !data) throw new VenatorError('not_found', 'Item introuvable')
  const { data: checklist } = await db.from('venator_checklists').select('*').eq('id', data.checklist_id).maybeSingle()
  if (checklist) {
    const etat = await etatChecklist(db, checklist.copro_id)
    if (etat && etat.progression === 100) await logJournal(db, { copro_id: checklist.copro_id, type_evenement: 'checklist_complete', contenu: 'Checklist nouvelle copro complétée', acteur: 'system' })
  }
  return data
}
