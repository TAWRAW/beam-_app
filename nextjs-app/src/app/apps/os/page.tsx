'use client'

// Page Ordre de Service (OS) — envoi d'un OS à un fournisseur via Estale.
// Mirroir de l'extension Chrome estale-os-express (popup/popup.ts + view.ts) en shadcn/ui.
// Transport : proxy beam-app /api/estale/graphql (admin-gated côté serveur).

import { useEffect, useState } from 'react'
import { Wrench, ChevronDown, Send, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { loadMe, loadCondos, loadCondoSuppliers, loadOwners } from '@/lib/os/queries'
import { sendOrder, emptyRecipients } from '@/lib/os/order-send'
import type { OrderTag } from '@/lib/os/order-send'
import type { Me, CondoLite, SupplierLite, OwnerLite, GqlFn, SupplierContact } from '@/lib/os/types'

const DEFER_MINUTES = 5

const DEFAULT_TAGS: OrderTag[] = [
  { label: 'Travaux', color: '#FFC300' },
  { label: 'Fournisseur', color: '#0EA5E9' },
]

/** Exécution GraphQL via le proxy admin-gated de beam-app. */
const gqlFn: GqlFn = async <T,>(query: string, variables: Record<string, unknown> = {}): Promise<T> => {
  const r = await fetch('/api/estale/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const j = await r.json()
  if (!r.ok || j.error) throw new Error(j.error || `HTTP ${r.status}`)
  return j.data as T
}

/** Texte brut → HTML paragraphes (Estale attend du HTML pour description / corps du mail). */
function toHtml(text: string): string {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
  return text.split(/\n/).map((l) => `<p>${esc(l)}</p>`).join('')
}

type Step = 'form' | 'preview'

export default function OrdreServicePage() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)

  const [me, setMe] = useState<Me | null>(null)
  const [condos, setCondos] = useState<CondoLite[]>([])
  const [suppliers, setSuppliers] = useState<SupplierLite[]>([])
  const [owners, setOwners] = useState<OwnerLite[]>([])

  // Sélections
  const [condoID, setCondoID] = useState<string | null>(null)
  const [supplierID, setSupplierID] = useState<string | null>(null)
  const [contactID, setContactID] = useState<string | null>(null)

  // Champs OS
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Options
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [reference, setReference] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [ccMe, setCcMe] = useState(true)
  const [ownerEnabled, setOwnerEnabled] = useState(false)
  const [ownerID, setOwnerID] = useState<string | null>(null)
  const [freeEmail, setFreeEmail] = useState('')

  // Étiquettes
  const [tagsOn, setTagsOn] = useState<boolean[]>(DEFAULT_TAGS.map(() => true))

  // Étape & aperçu
  const [step, setStep] = useState<Step>('form')
  const [editObject, setEditObject] = useState('')
  const [editBody, setEditBody] = useState('')
  const [sending, setSending] = useState(false)

  // Chargement initial : me + copros
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const meData = await loadMe(gqlFn)
        const condoData = await loadCondos(gqlFn)
        if (cancelled) return
        setMe(meData)
        setCondos(condoData)
        const firstCondo = condoData[0]?.id ?? null
        setCondoID(firstCondo)
        if (firstCondo) {
          const sup = await loadCondoSuppliers(gqlFn, firstCondo)
          if (cancelled) return
          setSuppliers(sup)
          setSupplierID(sup[0]?.id ?? null)
          setContactID(sup[0]?.contacts[0]?.id ?? null)
        }
      } catch (e) {
        if (!cancelled) setLoadError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Change de copropriété → recharge fournisseurs + reset copropriétaires
  async function handleCondoChange(id: string) {
    setCondoID(id)
    setSupplierID(null)
    setContactID(null)
    setOwners([])
    setOwnerID(null)
    setStatus(null)
    try {
      const sup = await loadCondoSuppliers(gqlFn, id)
      setSuppliers(sup)
      setSupplierID(sup[0]?.id ?? null)
      setContactID(sup[0]?.contacts[0]?.id ?? null)
      if (ownerEnabled) setOwners(await loadOwners(gqlFn, id))
    } catch (e) {
      setStatus({ kind: 'err', msg: `Chargement fournisseurs : ${(e as Error).message}` })
    }
  }

  function handleSupplierChange(id: string) {
    setSupplierID(id)
    const sup = suppliers.find((s) => s.id === id)
    setContactID(sup?.contacts[0]?.id ?? null)
  }

  async function handleOwnerToggle(on: boolean) {
    setOwnerEnabled(on)
    if (on && condoID && owners.length === 0) {
      try {
        setOwners(await loadOwners(gqlFn, condoID))
      } catch (e) {
        setStatus({ kind: 'err', msg: `Chargement copropriétaires : ${(e as Error).message}` })
      }
    }
  }

  const selectedSupplier = suppliers.find((s) => s.id === supplierID)
  const contacts: SupplierContact[] = selectedSupplier?.contacts ?? []
  const selectedContact = contacts.find((k) => k.id === contactID)
  const selectedCondo = condos.find((c) => c.id === condoID)
  const selectedOwner = ownerEnabled ? owners.find((o) => o.id === ownerID) : undefined

  const activeOptsCount = [reference, urgent, ccMe, ownerEnabled, freeEmail].filter(Boolean).length

  // Passage à l'aperçu (mêmes validations que l'extension)
  function goToPreview() {
    if (!condoID || !selectedContact?.email || !title.trim() || !description.trim()) {
      setStatus({ kind: 'err', msg: 'Copropriété, contact fournisseur (avec email), titre et description requis.' })
      return
    }
    if (!me?.collaborator?.id) {
      setStatus({ kind: 'err', msg: 'Profil collaborateur Estale introuvable — impossible d’émettre l’OS.' })
      return
    }
    const condo = selectedCondo!
    const object = reference ? `${reference} | ${title}` : title
    const body = `Bonjour,\n\nJe vous prie de bien vouloir trouver ci-joint une demande d'intervention pour la copropriété ${condo.name}.\n\nJe vous remercie par avance et vous souhaite une bonne journée.\n\nCordialement,\n${me.collaborator?.fullname ?? 'Beamô'}`
    setEditObject(object)
    setEditBody(body)
    setStatus(null)
    setStep('preview')
  }

  async function handleSend() {
    if (sending) return
    if (!condoID || !selectedContact || !me?.collaborator?.id) return
    setSending(true)
    setStatus(null)
    try {
      const bccExternals: string[] = []
      if (ccMe && me.collaborator?.email) bccExternals.push(me.collaborator.email)
      if (freeEmail.trim()) bccExternals.push(freeEmail.trim())
      const res = await sendOrder(gqlFn, {
        condoID,
        taskLabel: title,
        title,
        description: toHtml(description),
        reference: reference || undefined,
        urgent,
        managerID: me.collaborator.id,
        sendAs: 'me',
        ownerIDs: [],
        recipientContactIDs: [selectedContact.id],
        recipients: {
          ...emptyRecipients(),
          bcc: {
            owners: selectedOwner?.id ? [selectedOwner.id] : [],
            suppliers: [selectedContact.id],
            externals: bccExternals,
          },
        },
        schedules: [{ object: editObject, title: editObject, body: toHtml(editBody), deferMinutes: DEFER_MINUTES }],
        tags: DEFAULT_TAGS.filter((_, i) => tagsOn[i]),
      })
      setStatus({
        kind: 'ok',
        msg: `OS créé — courriel programmé dans ${DEFER_MINUTES} min (annulable depuis Estale). Réf interne ${res.eventID.slice(0, 8)}.`,
      })
      // succès → on laisse le bouton désactivé (sending reste true) pour empêcher un renvoi du même OS
    } catch (e) {
      setStatus({ kind: 'err', msg: `Échec : ${(e as Error).message}` })
      setSending(false)
    }
  }

  // ---------- Rendu ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement…
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <Card className="border-2 border-black">
          <CardContent className="p-4 flex items-start gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Impossible de charger les données Estale.</p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-xl mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <div className="grid place-content-center h-9 w-9 rounded-xl bg-[#FFC300] border-2 border-black">
          <Wrench className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-bold">Ordre de service</h1>
      </div>

      {status && (
        <div
          className={`mb-4 rounded-xl border-2 border-black p-3 text-sm flex items-start gap-2 ${
            status.kind === 'ok' ? 'bg-[#A8E6A1]' : 'bg-[#FFF1F1]'
          }`}
        >
          {status.kind === 'ok' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span>{status.msg}</span>
        </div>
      )}

      {step === 'form' && (
        <Card className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Nouvel OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Copropriété */}
            <div className="space-y-1.5">
              <Label>Copropriété</Label>
              <Select value={condoID ?? undefined} onValueChange={handleCondoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une copropriété" />
                </SelectTrigger>
                <SelectContent>
                  {condos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fournisseur */}
            <div className="space-y-1.5">
              <Label>Fournisseur</Label>
              <Select value={supplierID ?? undefined} onValueChange={handleSupplierChange} disabled={suppliers.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={suppliers.length ? 'Choisir un fournisseur' : 'Aucun fournisseur sur cette copro'} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact */}
            <div className="space-y-1.5">
              <Label>Contact</Label>
              <Select value={contactID ?? undefined} onValueChange={setContactID} disabled={contacts.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={contacts.length ? 'Choisir un contact' : 'Aucun contact'} />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                      {k.email ? ` — ${k.email}` : ' (sans email)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Titre */}
            <div className="space-y-1.5">
              <Label htmlFor="os-title">Titre de l’intervention</Label>
              <Input
                id="os-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex : Changer le cylindre du hall B"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="os-desc">Description (corps de l’OS)</Label>
              <Textarea
                id="os-desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détaillez l’intervention demandée…"
              />
            </div>

            {/* Options repliables */}
            <div className="rounded-xl border-2 border-black overflow-hidden">
              <button
                type="button"
                onClick={() => setOptionsOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold bg-[#F2F1E6]"
              >
                <span>
                  Options
                  {activeOptsCount > 0 && (
                    <span className="ml-2 inline-grid place-content-center min-w-5 h-5 px-1 rounded-full bg-[#FFC300] border border-black text-xs">
                      {activeOptsCount}
                    </span>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${optionsOpen ? 'rotate-180' : ''}`} />
              </button>
              {optionsOpen && (
                <div className="p-3 space-y-3">
                  <div className="flex gap-3 items-end">
                    <div className="space-y-1.5 flex-1">
                      <Label htmlFor="os-ref">Référence</Label>
                      <Input
                        id="os-ref"
                        value={reference}
                        maxLength={5}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="ex : 20006"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm pb-2.5 cursor-pointer">
                      <Checkbox checked={urgent} onCheckedChange={(v) => setUrgent(v === true)} />
                      Urgent
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={ccMe} onCheckedChange={(v) => setCcMe(v === true)} />
                    Me mettre en copie (BCC)
                  </label>

                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={ownerEnabled} onCheckedChange={(v) => handleOwnerToggle(v === true)} />
                    Informer un copropriétaire
                  </label>

                  {ownerEnabled && (
                    <div className="space-y-1.5">
                      <Label>Copropriétaire</Label>
                      <Select value={ownerID ?? undefined} onValueChange={setOwnerID} disabled={owners.length === 0}>
                        <SelectTrigger>
                          <SelectValue placeholder={owners.length ? 'Choisir un copropriétaire' : 'Aucun copropriétaire'} />
                        </SelectTrigger>
                        <SelectContent>
                          {owners.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.fullname}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="os-free-email">Email libre en copie</Label>
                    <Input
                      id="os-free-email"
                      type="email"
                      value={freeEmail}
                      onChange={(e) => setFreeEmail(e.target.value)}
                      placeholder="prestataire@exemple.fr"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Étiquettes */}
            <div className="space-y-1.5">
              <Label>Étiquettes</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_TAGS.map((t, i) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setTagsOn((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                    className={`px-3 py-1 rounded-full border-2 border-black text-sm font-medium transition-colors ${
                      tagsOn[i] ? 'bg-[#FFC300]' : 'bg-white text-muted-foreground'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={goToPreview}
              className="w-full rounded-full bg-[#FFC300] text-black border-2 border-black hover:bg-[#e6b000] font-semibold"
            >
              Aperçu →
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && (
        <Card className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aperçu de l’OS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Destinataire</Label>
              <p className="text-sm">
                {selectedContact?.name} &lt;{selectedContact?.email}&gt;
              </p>
            </div>

            {(() => {
              const bcc: string[] = []
              if (ccMe && me?.collaborator?.email) bcc.push(me.collaborator.email)
              if (freeEmail.trim()) bcc.push(freeEmail.trim())
              if (selectedOwner?.email) bcc.push(selectedOwner.email)
              return bcc.length ? (
                <div className="space-y-1">
                  <Label>Copie (BCC)</Label>
                  <p className="text-sm text-muted-foreground">{bcc.join(', ')}</p>
                </div>
              ) : null
            })()}

            <div className="rounded-xl border-2 border-black bg-[#F2F1E6] p-3 space-y-2">
              <p className="text-sm font-semibold">
                Ordre de service <span className="font-normal text-muted-foreground">(PDF généré par Estale)</span>
              </p>
              <div>
                <Label className="text-xs">Titre</Label>
                <p className="text-sm">{title}</p>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <p className="text-sm whitespace-pre-wrap">{description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold">
                Courriel d’accompagnement <span className="font-normal text-muted-foreground">(modifiable)</span>
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="os-object">Objet</Label>
                <Input id="os-object" value={editObject} onChange={(e) => setEditObject(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="os-body">Corps</Label>
                <Textarea id="os-body" rows={7} value={editBody} onChange={(e) => setEditBody(e.target.value)} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Le courriel partira dans {DEFER_MINUTES} min — annulable depuis Estale d’ici là.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('form')}
                disabled={sending}
                className="flex-1 rounded-full border-2 border-black"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Modifier
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending}
                className="flex-[2] rounded-full bg-[#FFC300] text-black border-2 border-black hover:bg-[#e6b000] font-semibold"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Envoi…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" /> Envoyer l’OS
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
