// src/lib/venator/services/role-resolver.ts
// Résolution pure du rôle Venator effectif (AUCUN import next/*, testable sans harness Next).
import type { SupabaseClient } from '@supabase/supabase-js'
import type { VenatorRole } from '../types'

// Résout le rôle effectif d'un email. Retourne null = accès refusé.
// Règles : utilisateur désactivé (disabled_at) => TOUJOURS refusé.
//          utilisateur connu actif => son rôle.
//          utilisateur inconnu => bootstrap admin UNIQUEMENT si la table est vide (premier utilisateur), sinon refusé.
export async function resolveRole(db: SupabaseClient, email: string): Promise<VenatorRole | null> {
  const { data: user } = await db.from('venator_users').select('*').eq('email', email).maybeSingle()
  if (user) {
    if (user.disabled_at) return null // désactivé => refusé, quoi qu'il arrive (révocation = effet immédiat)
    return user.role as VenatorRole
  }
  // inconnu : bootstrap seulement si AUCUN utilisateur n'existe dans la table
  const { data: all } = await db.from('venator_users').select('id')
  if (!all || all.length === 0) {
    await db.from('venator_users').insert({ email, role: 'admin', invited_by: 'bootstrap' })
    return 'admin'
  }
  return null
}
