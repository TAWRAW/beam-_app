'use client'

import { useEffect, useState } from 'react'
import {
  getVisiteDiagnostic,
  cleanupVisitDuplicates,
  type VisiteDiagnosticReport,
} from '@/lib/visites/db'
import { flushAll } from '@/lib/visites/sync-engine'

interface Props {
  visitId: string
  condoId: string
}

interface EstaleFile {
  id: string
  filename: string
}
interface EstaleCommentLite {
  id: string
  rank: number
  content: string
  place: string
  component: string
  documents: EstaleFile[]
}
interface EstaleSnapshot {
  comments: EstaleCommentLite[]
  fetchedAt: string
}

const statusEmoji = (s: string) =>
  ({ synced: '✅', pending: '⏳', syncing: '⏳', error: '❌' }[s] || '?')

export function VisiteDiagnostic({ visitId, condoId }: Props) {
  const [open, setOpen] = useState(false)
  const [report, setReport] = useState<VisiteDiagnosticReport | null>(null)
  const [estale, setEstale] = useState<EstaleSnapshot | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function refresh() {
    setReport(await getVisiteDiagnostic(visitId))
    try {
      const res = await fetch(
        `/api/estale/visits/${visitId}?condoId=${encodeURIComponent(condoId)}`,
      )
      const json = await res.json()
      const v = json.visit
      if (v) {
        setEstale({
          comments: (v.comments || []).map((c: EstaleCommentLite) => ({
            id: c.id,
            rank: c.rank,
            content: c.content || '',
            place: c.place,
            component: c.component,
            documents: c.documents || [],
          })),
          fetchedAt: new Date().toISOString(),
        })
      }
    } catch {
      /* offline ou erreur */
    }
  }

  useEffect(() => {
    if (open) refresh()
  }, [open, visitId])

  async function handleFlush() {
    setBusy(true)
    setMsg(null)
    try {
      await flushAll()
      await refresh()
      setMsg('Resync forcée terminée.')
    } catch (e) {
      setMsg('Erreur : ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  async function handleCleanup() {
    if (!confirm("Supprimer les doublons IndexedDB et les orphelins ? Les données estale ne sont pas touchées.")) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await cleanupVisitDuplicates(visitId)
      await refresh()
      setMsg(
        `Local nettoyé : ${res.removedComments} comments doublons, ${res.removedPhotos} photos, ${res.removedOrphans} orphelins.`,
      )
    } catch (e) {
      setMsg('Erreur : ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteEstaleFile(commentId: string, fileId: string, filename: string) {
    if (!confirm(`Supprimer DÉFINITIVEMENT côté Estale le fichier "${filename}" ? Cette action est irréversible.`)) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(
        `/api/estale/visits/${visitId}/comments/${commentId}/files/${fileId}`,
        { method: 'DELETE' },
      )
      if (!res.ok) throw new Error('HTTP ' + res.status)
      await refresh()
      setMsg(`Supprimé côté Estale : ${filename}`)
    } catch (e) {
      setMsg('Erreur suppression : ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  // Détecte les doublons Estale : même filename sur le même comment
  function getDuplicateFileIds(docs: EstaleFile[]): Set<string> {
    const byName: Record<string, EstaleFile[]> = {}
    for (const d of docs) {
      if (!byName[d.filename]) byName[d.filename] = []
      byName[d.filename]!.push(d)
    }
    const dupIds = new Set<string>()
    for (const arr of Object.values(byName)) {
      if (arr.length > 1) {
        // Tous sauf le premier sont considérés doublons (le 1er est gardé)
        for (let i = 1; i < arr.length; i++) dupIds.add(arr[i]!.id)
      }
    }
    return dupIds
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full text-center bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] py-2 font-bold text-xs uppercase tracking-wide rounded-full transition active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000]"
      >
        🔧 Ouvrir le diagnostic local
      </button>
    )
  }

  return (
    <section className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-black uppercase tracking-tight text-sm">🔧 Diagnostic</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs font-bold underline"
        >
          fermer
        </button>
      </div>

      {report === null && <p className="text-xs">Chargement…</p>}

      {report && (
        <>
          <div className="text-xs space-y-1">
            <div><strong>Visites locales :</strong> {report.visits.length}</div>
            <div><strong>Lignes locales :</strong> {report.comments.length}</div>
            <div><strong>Photos locales :</strong> {report.photos.length}</div>
            {report.orphanComments.length > 0 && (
              <div className="text-red-700">
                <strong>Lignes orphelines :</strong> {report.orphanComments.length}
              </div>
            )}
            {Object.keys(report.duplicateCommentsByEstaleId).length > 0 && (
              <div className="text-red-700">
                <strong>Lignes en doublon (local) :</strong> {Object.keys(report.duplicateCommentsByEstaleId).length}
              </div>
            )}
            {Object.keys(report.duplicatePhotosByEstaleFileId).length > 0 && (
              <div className="text-red-700">
                <strong>Photos en doublon (local) :</strong> {Object.keys(report.duplicatePhotosByEstaleFileId).length}
              </div>
            )}
          </div>

          {/* Section Estale (remote) */}
          {estale && (
            <div className="border-t-2 border-black pt-3">
              <div className="font-black uppercase text-xs mb-2">📡 Côté Estale (remote)</div>
              <div className="space-y-2">
                {estale.comments.map((c) => {
                  const dupIds = getDuplicateFileIds(c.documents)
                  return (
                    <div key={c.id} className="bg-gray-50 border-2 border-black rounded-xl p-2 text-[11px]">
                      <div className="font-bold mb-1">
                        #{c.rank} {c.place} • {c.component}
                      </div>
                      <div className="text-gray-600 mb-2">"{c.content.slice(0, 60)}…"</div>
                      {c.documents.length === 0 ? (
                        <div className="text-gray-400">aucun fichier</div>
                      ) : (
                        <div className="space-y-1">
                          {c.documents.map((d) => {
                            const isDup = dupIds.has(d.id)
                            return (
                              <div
                                key={d.id}
                                className={`flex items-center justify-between gap-2 p-1.5 rounded-lg ${isDup ? 'bg-red-100 border border-red-700' : 'bg-white border border-black/20'}`}
                              >
                                <div className="font-mono break-all flex-1">
                                  {isDup && <span className="font-bold text-red-700">⚠ DOUBLON </span>}
                                  📷 {d.filename}
                                </div>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleDeleteEstaleFile(c.id, d.id, d.filename)}
                                  className="bg-[#FF6B6B] border-2 border-black px-2 py-0.5 text-[10px] font-bold uppercase rounded-full shrink-0 disabled:opacity-50"
                                >
                                  🗑
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {msg && (
            <p className="bg-[#A8E6A1] border-2 border-black rounded-xl px-3 py-2 text-xs font-bold">{msg}</p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleFlush}
              disabled={busy}
              className="bg-primary border-2 border-black shadow-[3px_3px_0px_0px_#000] py-2 px-3 font-bold text-xs uppercase rounded-full disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition"
            >
              🔄 Resync forcée
            </button>
            <button
              type="button"
              onClick={handleCleanup}
              disabled={busy}
              className="bg-[#FF6B6B] border-2 border-black shadow-[3px_3px_0px_0px_#000] py-2 px-3 font-bold text-xs uppercase rounded-full disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#000] transition"
            >
              🧹 Nettoyer local
            </button>
          </div>
        </>
      )}
    </section>
  )
}
