// src/lib/venator/services/_supabase-admin.ts
// Client service-role (bypass RLS) — toujours appelé derrière requireVenatorRole() côté route.
// IMPORTANT : `cache: 'no-store'` désactive le cache fetch de Next.js App Router.
// Sans ça, les GET Supabase (passant par fetch) sont mis en cache par Next et renvoient
// des résultats périmés (ex. liste vide capturée avant un insert). Bug e2e réel, invisible en tests unitaires.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function createVenatorAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: 'no-store' }),
      },
    },
  )
}
