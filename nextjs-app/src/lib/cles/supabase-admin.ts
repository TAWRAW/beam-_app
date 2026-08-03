// src/lib/cles/supabase-admin.ts
// Client Supabase service-role pour les routes API du module Clés.
// (Bypass RLS — toujours derrière requireAdmin() côté route.)
import { createClient } from '@supabase/supabase-js'

export function createClesAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
