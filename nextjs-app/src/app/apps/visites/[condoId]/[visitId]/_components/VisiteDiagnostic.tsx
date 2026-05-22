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
}

const statusEmoji = (s: string) =>
  ({ synced: '✅', pending: '⏳', syncing: '⏳', error: '❌' }[s] || '?')

export function VisiteDiagnostic({ visitId }: Props) {
  const [open, setOpen] = useState(false)
  const [report, setReport] = useState<VisiteDiagnosticReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function refresh() {
    setReport(await getVisiteDiagnostic(visitId))
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
    if (!confirm("Supprimer les doublons IndexedDB et les orphelins (drafts pré-correctif) ? Les données estale ne sont pas touchées.")) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await cleanupVisitDuplicates(visitId)
      await refresh()
      setMsg(
        `Nettoyé : ${res.removedComments} comments doublons, ${res.removedPhotos} photos doublons/orphelines, ${res.removedOrphans} drafts orphelins.`,
      )
    } catch (e) {
      setMsg('Erreur : ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
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
        <h3 className="font-black uppercase tracking-tight text-sm">🔧 Diagnostic local</h3>
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
            <div className="text-red-700">
              <strong>Lignes orphelines (ancien bug) :</strong> {report.orphanComments.length}
            </div>
            <div className="text-red-700">
              <strong>Lignes en doublon :</strong> {Object.keys(report.duplicateCommentsByEstaleId).length}
            </div>
            <div className="text-red-700">
              <strong>Photos en doublon :</strong> {Object.keys(report.duplicatePhotosByEstaleFileId).length}
            </div>
          </div>

          {report.visits.map((v) => (
            <div key={v.localId} className="bg-gray-50 border-2 border-black rounded-xl p-2 text-[11px] font-mono break-all">
              <div>{statusEmoji(v.syncStatus)} visit <strong>{v.localId.slice(0, 8)}</strong> → estale {v.estaleVisitId?.slice(0, 8) || '∅'}</div>
            </div>
          ))}

          {[...report.comments, ...report.orphanComments].map((c) => {
            const photos = report.photos.filter((p) => p.commentLocalId === c.localId)
            const isOrphan = c.visitLocalId === visitId
            return (
              <div key={c.localId} className={`border-2 border-black rounded-xl p-2 text-[11px] font-mono break-all ${isOrphan ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div>
                  {statusEmoji(c.syncStatus)} comment <strong>{c.localId.slice(0, 8)}</strong>
                  {' '}→ estale {c.estaleCommentId?.slice(0, 8) || '∅'}
                  {isOrphan && <span className="text-red-700 font-bold"> [ORPHELIN]</span>}
                </div>
                <div className="text-gray-600">"{(c.payload as { content?: string })?.content?.slice(0, 50)}…"</div>
                {photos.map((p) => (
                  <div key={p.localId} className="ml-3">
                    {statusEmoji(p.syncStatus)} 📷 {p.localId.slice(0, 6)} → estale {p.estaleFileId?.slice(0, 8) || '∅'} ({p.filename})
                  </div>
                ))}
              </div>
            )
          })}

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
              🧹 Nettoyer doublons
            </button>
          </div>
        </>
      )}
    </section>
  )
}
