import { NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { accessTokenGoogle } from '@/lib/venator/google/client'
import { construireArbre, type GmailLabelBrut } from '@/lib/venator/google/labels'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

/** Arborescence des libellés personnels, pour le sélecteur de liaison. */
export async function GET() {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  try {
    const db = createVenatorAdminClient()
    const token = await accessTokenGoogle(db)

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new VenatorError('invalid', `Gmail a refusé la requête (${res.status}) ${detail.slice(0, 200)}`)
    }

    const { labels } = (await res.json()) as { labels?: GmailLabelBrut[] }
    return NextResponse.json({ labels: construireArbre(labels ?? []) })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
