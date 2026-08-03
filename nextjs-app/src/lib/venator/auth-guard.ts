// src/lib/venator/auth-guard.ts
// Garde d'accès Venator. V1 : s'appuie sur requireAdmin() (auth beam-app legacy) + table venator_users.
// Bootstrap : le premier utilisateur qui se connecte (table vide) devient admin Venator.
// Révocation = effet immédiat : un utilisateur désactivé (disabled_at) est TOUJOURS refusé (cf. role-resolver.ts).
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/server-auth'
import { createVenatorAdminClient } from './services/_supabase-admin'
import { resolveRole } from './services/role-resolver'
import type { VenatorRole } from './types'

const ORDRE: Record<VenatorRole, number> = { invite: 1, gestionnaire: 2, admin: 3 }

export async function requireVenatorRole(min: VenatorRole): Promise<{ ok: true; email: string; role: VenatorRole } | { ok: false; response: NextResponse }> {
  const auth = await requireAdmin()
  if (!auth.ok || !auth.email) return { ok: false, response: auth.response ?? NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) }
  const db = createVenatorAdminClient()
  const role = await resolveRole(db, auth.email)
  if (!role || ORDRE[role] < ORDRE[min]) return { ok: false, response: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) }
  await db.from('venator_users').update({ last_login_at: new Date().toISOString() }).eq('email', auth.email)
  return { ok: true, email: auth.email, role }
}
