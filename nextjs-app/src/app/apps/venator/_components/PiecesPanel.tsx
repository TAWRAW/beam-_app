'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ExternalLink, File, FolderPlus, FolderTree, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { fetcher } from '@/lib/venator/useVenator'
import type { Copro, Dossier } from '@/lib/venator/types'
import { DOSSIER_TYPE_LABELS } from '@/lib/venator/labels'
import LierDriveDialog from './LierDriveDialog'
import { venatorButtonSecondary, venatorMicroLabel } from './venator-ui-classes'

interface Piece {
  id: string
  nom: string
  url: string | null
  taille: number | null
  modifie: string | null
}

function formatTaille(o: number | null) {
  if (o === null) return null
  if (o < 1024) return `${o} o`
  if (o < 1024 * 1024) return `${Math.round(o / 1024)} ko`
  return `${(o / 1024 / 1024).toFixed(1)} Mo`
}

/**
 * Pièces Drive d'un dossier.
 *
 * Le dossier Drive n'est pas créé d'office à l'ouverture d'un dossier Venator :
 * beaucoup n'auront jamais de pièce, et semer des dossiers vides dans le Drive
 * du cabinet le rendrait vite illisible. Il se crée au premier besoin.
 */
export default function PiecesPanel({
  dossier,
  copro,
  onCoproLiee,
  onDossierCree,
}: {
  dossier: Dossier
  copro: Copro & { drive_folder_id?: string | null }
  onCoproLiee: () => void
  onDossierCree: () => void
}) {
  const [lierOpen, setLierOpen] = useState(false)
  // Nom du dossier Drive à créer. Pré-rempli avec le titre, mais modifiable : un
  // titre de dossier fait parfois 97 caractères, illisibles dans l'arborescence.
  const [nomDrive, setNomDrive] = useState(dossier.titre)
  // Certains types se rangent à plat : les PV sous « Procès Verbaux », sans un
  // sous-dossier par assemblée qui n'ajouterait qu'un clic à chaque consultation.
  const [avecSousDossier, setAvecSousDossier] = useState(true)
  const [survol, setSurvol] = useState(false)
  const [arboMsg, setArboMsg] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, mutate: rechargerPieces } = useSWR<{ pieces: Piece[] }>(
    dossier.drive_folder_id ? `/api/venator/dossiers/${dossier.id}/drive` : null,
    fetcher
  )
  const pieces = data?.pieces ?? []

  async function lierCopro(folderId: string) {
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/venator/copros/${copro.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drive_folder_id: folderId }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      onCoproLiee()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de rattachement')
    } finally {
      setPending(false)
    }
  }

  async function creerDossierDrive() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/venator/dossiers/${dossier.id}/drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: nomDrive, sousDossier: avecSousDossier }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`)
      onDossierCree()
      await rechargerPieces()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setPending(false)
    }
  }

  /** Met en place l'arborescence type sous la copropriété (dossiers manquants). */
  async function creerArborescence() {
    if (pending) return
    if (!window.confirm(`Créer les dossiers manquants de l'arborescence type sous « ${copro.nom} » ? Aucun fichier ne sera déplacé.`)) return
    setPending(true)
    setError(null)
    setArboMsg(null)
    try {
      const res = await fetch(`/api/venator/copros/${copro.id}/drive/arborescence`, { method: 'POST' })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(typeof body?.error === 'string' ? body.error : `Erreur ${res.status}`)
      setArboMsg(
        body.crees.length === 0
          ? 'Arborescence déjà complète.'
          : `${body.crees.length} dossier(s) créé(s) : ${body.crees.join(', ')}.`
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setPending(false)
    }
  }

  async function deposer(fichiers: FileList | null) {
    if (!fichiers?.length || pending) return
    setPending(true)
    setError(null)
    try {
      // Séquentiel : Drive limite les écritures concurrentes, et un envoi en
      // parallèle rendrait l'échec d'un fichier difficile à rattacher au bon.
      for (const fichier of Array.from(fichiers)) {
        const form = new FormData()
        form.append('fichier', fichier)
        const res = await fetch(`/api/venator/dossiers/${dossier.id}/drive/upload`, {
          method: 'POST',
          body: form,
        })
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(typeof body?.error === 'string' ? body.error : `Échec sur « ${fichier.name} »`)
        }
      }
      await rechargerPieces()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de dépôt')
    } finally {
      setPending(false)
      setSurvol(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--venator-radius-lg)] bg-venator-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className={venatorMicroLabel}>Pièces</h2>
        {dossier.drive_folder_url && (
          <a
            href={dossier.drive_folder_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] text-venator-fg-muted transition-colors hover:text-venator-fg"
          >
            Ouvrir dans Drive
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {error && <p className="text-[12px] font-medium text-venator-danger">{error}</p>}
      {arboMsg && <p className="text-[12px] text-venator-fg-muted">{arboMsg}</p>}

      {!copro.drive_folder_id ? (
        <>
          <p className="text-[13px] text-venator-fg-faint">
            Le dossier Drive de cette copropriété n&apos;est pas encore rattaché.
          </p>
          <Button
            type="button"
            onClick={() => setLierOpen(true)}
            className={cn(venatorButtonSecondary, 'h-7 w-fit px-2.5 text-[12px]')}
          >
            Rattacher le Drive de la copropriété
          </Button>
        </>
      ) : !dossier.drive_folder_id ? (
        <>
          <Button
            type="button"
            onClick={creerArborescence}
            disabled={pending}
            className={cn(venatorButtonSecondary, 'h-7 w-fit gap-1.5 px-2.5 text-[12px]')}
          >
            <FolderTree className="h-3.5 w-3.5" />
            Créer l&apos;arborescence type
          </Button>
          {/* Le chemin est annoncé avant création : Venator écrit dans le Drive
              du cabinet, l'utilisateur doit savoir où. */}
          <p className="text-[13px] text-venator-fg-faint">
            Aucun dossier Drive. Il sera créé dans&nbsp;:
          </p>
          <p className="rounded-[var(--venator-radius-md)] bg-venator-surface-2 px-2.5 py-2 text-[12px] text-venator-fg">
            {copro.nom} / {DOSSIER_TYPE_LABELS[dossier.type]} /
          </p>
          {avecSousDossier && (
          <Input
            value={nomDrive}
            onChange={(e) => setNomDrive(e.target.value)}
            placeholder="Nom du dossier Drive"
            maxLength={120}
            className="h-8 border-0 bg-venator-surface-2 text-[12px] text-venator-fg placeholder:text-venator-fg-faint focus-visible:ring-1 focus-visible:ring-venator-border-strong"
          />
          )}
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-venator-fg-muted">
            <input
              type="checkbox"
              checked={avecSousDossier}
              onChange={(e) => setAvecSousDossier(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--venator-accent)]"
            />
            Créer un sous-dossier — sinon les pièces vont directement dans «&nbsp;
            {DOSSIER_TYPE_LABELS[dossier.type]}&nbsp;»
          </label>
          <Button
            type="button"
            onClick={creerDossierDrive}
            disabled={pending || (avecSousDossier && nomDrive.trim().length === 0)}
            className={cn(venatorButtonSecondary, 'h-7 w-fit gap-1.5 px-2.5 text-[12px]')}
          >
            <FolderPlus className="h-3.5 w-3.5" />
            {pending ? 'Création…' : 'Créer le dossier Drive'}
          </Button>
        </>
      ) : (
        <>
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setSurvol(true)
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault()
            deposer(e.dataTransfer.files)
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-1 rounded-[var(--venator-radius-md)] border border-dashed px-3 py-4 text-center transition-colors',
            survol
              ? 'border-venator-accent bg-venator-accent/[0.06]'
              : 'border-venator-border-strong hover:bg-venator-surface-2'
          )}
        >
          <Upload className="h-4 w-4 text-venator-fg-faint" />
          <span className="text-[12px] text-venator-fg-muted">
            {pending ? 'Dépôt en cours…' : 'Glisser un fichier ou cliquer'}
          </span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              deposer(e.target.files)
              e.target.value = ''
            }}
          />
        </label>

        {pieces.length === 0 ? (
          <p className="text-[13px] text-venator-fg-faint">Dossier Drive vide.</p>
        ) : (
        <ul className="flex flex-col divide-y divide-venator-border">
          {pieces.map((p) => (
            <li key={p.id} className="py-2 first:pt-0 last:pb-0">
              <a
                href={p.url ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 transition-colors hover:text-venator-accent"
              >
                <File className="mt-0.5 h-3.5 w-3.5 shrink-0 text-venator-fg-faint" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-venator-fg">{p.nom}</span>
                  <span className="block text-[11px] text-venator-fg-faint">
                    {[
                      formatTaille(p.taille),
                      p.modifie ? new Date(p.modifie).toLocaleDateString('fr-FR') : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        )}
        </>
      )}

      <LierDriveDialog
        open={lierOpen}
        onOpenChange={setLierOpen}
        onChoisir={(d) => lierCopro(d.id)}
        titre={`Dossier Drive de « ${copro.nom} »`}
      />
    </div>
  )
}
