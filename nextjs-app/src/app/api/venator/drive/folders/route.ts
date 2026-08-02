import { NextRequest, NextResponse } from 'next/server'
import { requireVenatorRole } from '@/lib/venator/auth-guard'
import { createVenatorAdminClient } from '@/lib/venator/services/_supabase-admin'
import { accessTokenGoogle } from '@/lib/venator/google/client'
import { VenatorError, httpStatus } from '@/lib/venator/services/errors'

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'

export interface DossierDrive {
  id: string
  nom: string
  cheminParent: string | null
  modifie: string | null
}

/**
 * Dossiers Drive, pour choisir celui à rattacher.
 *
 * `q` recherche par nom ; `parent` navigue dans un dossier donné. Sans l'un ni
 * l'autre, on liste la racine — un Drive entier ne se parcourt pas à plat.
 */
export async function GET(req: NextRequest) {
  const auth = await requireVenatorRole('admin')
  if (!auth.ok) return auth.response

  const recherche = req.nextUrl.searchParams.get('q')?.trim()
  const parent = req.nextUrl.searchParams.get('parent')?.trim()

  try {
    const token = await accessTokenGoogle(createVenatorAdminClient())

    // Toujours restreint aux dossiers non supprimés : proposer un fichier ou une
    // corbeille comme destination n'aurait aucun sens.
    const clauses = ["mimeType = 'application/vnd.google-apps.folder'", 'trashed = false']
    if (recherche) clauses.push(`name contains '${recherche.replace(/'/g, "\\'")}'`)
    else clauses.push(`'${parent || 'root'}' in parents`)

    const params = new URLSearchParams({
      q: clauses.join(' and '),
      fields: 'files(id,name,modifiedTime,parents)',
      orderBy: 'name',
      pageSize: '100',
      // Inclut les Drive partagés : l'arborescence du cabinet peut y vivre.
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    })

    const res = await fetch(`${DRIVE_API}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new VenatorError('invalid', `Drive a refusé la requête (${res.status}) ${detail.slice(0, 200)}`)
    }

    const { files } = (await res.json()) as {
      files?: { id: string; name: string; modifiedTime?: string }[]
    }

    const dossiers: DossierDrive[] = (files ?? []).map((f) => ({
      id: f.id,
      nom: f.name,
      cheminParent: null, // résolu à la demande : un aller-retour par dossier serait coûteux
      modifie: f.modifiedTime ?? null,
    }))

    return NextResponse.json({ dossiers })
  } catch (e) {
    if (e instanceof VenatorError) return NextResponse.json({ error: e.message }, { status: httpStatus[e.code] })
    throw e
  }
}
