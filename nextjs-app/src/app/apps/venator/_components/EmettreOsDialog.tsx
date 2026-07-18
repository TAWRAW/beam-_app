'use client'

// EmettreOsDialog — émet un OS Estale depuis un ticket Venator (Lot2 Task 4).
// Charge les fournisseurs (+ contacts) Estale de la copro du ticket, puis POST /api/venator/os.

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCopros } from '@/lib/venator/useVenator'

/** Ticket minimal requis pour émettre un OS (id + rattachement copro + titre par défaut). */
export interface OsTicket {
  id: string
  copro_id: string
  titre: string
}

interface EstaleSupplierContact {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface EstaleCondoSupplier {
  id: string
  name: string
  contacts: EstaleSupplierContact[]
}

interface ContactOption {
  contactId: string
  label: string
  prestataireNom: string
}

export default function EmettreOsDialog({
  ticket,
  open,
  onOpenChange,
  onEmis,
}: {
  ticket: OsTicket | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEmis?: () => void
}) {
  const { data: coprosData } = useCopros()
  const coproEstaleId = useMemo(
    () => coprosData?.copros.find((c) => c.id === ticket?.copro_id)?.estale_id,
    [coprosData, ticket]
  )

  const [suppliers, setSuppliers] = useState<EstaleCondoSupplier[]>([])
  const [cabinetSuppliers, setCabinetSuppliers] = useState<EstaleCondoSupplier[]>([])
  const [suppliersLoading, setSuppliersLoading] = useState(false)
  const [suppliersError, setSuppliersError] = useState<string | null>(null)

  const [prestataireContactId, setPrestataireContactId] = useState('')
  const [objet, setObjet] = useState('')
  const [description, setDescription] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [codeAcces, setCodeAcces] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // (Re)charge les fournisseurs Estale de la copro dès l'ouverture, réinitialise le formulaire.
  useEffect(() => {
    if (!open || !ticket) {
      setSuppliers([])
      setCabinetSuppliers([])
      setSuppliersError(null)
      setPrestataireContactId('')
      setObjet('')
      setDescription('')
      setUrgent(false)
      setCodeAcces('')
      setError(null)
      setSuccess(false)
      return
    }
    setObjet(ticket.titre)
    setDescription('')
    setUrgent(false)
    setCodeAcces('')
    setPrestataireContactId('')
    setError(null)
    setSuccess(false)

    if (!coproEstaleId) return
    let cancelled = false
    setSuppliersLoading(true)
    setSuppliersError(null)
    fetch(`/api/venator/estale/suppliers?copro_estale_id=${encodeURIComponent(coproEstaleId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          throw new Error(body?.error ?? `Erreur ${res.status}`)
        }
        return res.json() as Promise<{ suppliers: EstaleCondoSupplier[]; cabinetSuppliers?: EstaleCondoSupplier[] }>
      })
      .then(({ suppliers, cabinetSuppliers }) => {
        if (!cancelled) {
          setSuppliers(suppliers ?? [])
          setCabinetSuppliers(cabinetSuppliers ?? [])
        }
      })
      .catch((e) => {
        if (!cancelled) setSuppliersError(e instanceof Error ? e.message : 'Erreur de chargement des fournisseurs')
      })
      .finally(() => {
        if (!cancelled) setSuppliersLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket?.id, coproEstaleId])

  const toOptions = (list: EstaleCondoSupplier[]): ContactOption[] =>
    list.flatMap((s) =>
      s.contacts.map((c) => ({
        contactId: c.id,
        label: `${s.name} — ${c.name} (${c.email ?? 'pas d\'email'})`,
        prestataireNom: `${s.name} — ${c.name}`,
      }))
    )

  const coproContacts: ContactOption[] = useMemo(() => toOptions(suppliers), [suppliers])
  const cabinetContacts: ContactOption[] = useMemo(() => toOptions(cabinetSuppliers), [cabinetSuppliers])
  const contacts: ContactOption[] = useMemo(
    () => [...coproContacts, ...cabinetContacts],
    [coproContacts, cabinetContacts]
  )

  const canSubmit =
    !!ticket &&
    prestataireContactId.length > 0 &&
    objet.trim().length > 0 &&
    description.trim().length > 0 &&
    !submitting &&
    !success

  async function handleSubmit() {
    if (!canSubmit || !ticket) return
    if (!window.confirm('Émettre et envoyer cet OS au prestataire ?')) return
    const contact = contacts.find((c) => c.contactId === prestataireContactId)
    if (!contact) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/venator/os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          prestataire_contact_id: prestataireContactId,
          prestataire_nom: contact.prestataireNom,
          objet: objet.trim(),
          description: description.trim(),
          urgent,
          code_acces: codeAcces.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message =
          typeof body?.error === 'string' ? body.error : body?.error ? JSON.stringify(body.error) : `Erreur ${res.status}`
        throw new Error(message)
      }
      setSuccess(true)
      onEmis?.()
      setTimeout(() => onOpenChange(false), 1200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Émettre un OS
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="os-prestataire">Prestataire</Label>
            <Select value={prestataireContactId} onValueChange={setPrestataireContactId} disabled={suppliersLoading || contacts.length === 0}>
              <SelectTrigger id="os-prestataire">
                <SelectValue
                  placeholder={
                    suppliersLoading
                      ? 'Chargement des fournisseurs…'
                      : contacts.length === 0
                        ? 'Aucun contact fournisseur trouvé'
                        : 'Choisir un contact fournisseur'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {coproContacts.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Fournisseurs de la copro</SelectLabel>
                    {coproContacts.map((c) => (
                      <SelectItem key={c.contactId} value={c.contactId}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {cabinetContacts.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Autres fournisseurs du cabinet</SelectLabel>
                    {cabinetContacts.map((c) => (
                      <SelectItem key={c.contactId} value={c.contactId}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {suppliersError && <p className="text-xs text-red-600 font-semibold">{suppliersError}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="os-objet">Objet</Label>
            <Input id="os-objet" value={objet} onChange={(e) => setObjet(e.target.value)} maxLength={200} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="os-description">Description</Label>
            <Textarea
              id="os-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détail de l'intervention demandée…"
              maxLength={20000}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="os-urgent" checked={urgent} onCheckedChange={(v) => setUrgent(v === true)} />
            <Label htmlFor="os-urgent" className="cursor-pointer">
              Urgent
            </Label>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="os-code-acces">Code d&apos;accès clés (optionnel)</Label>
            <Input
              id="os-code-acces"
              value={codeAcces}
              onChange={(e) => setCodeAcces(e.target.value)}
              placeholder="Ex : boîte à clés 1234"
              maxLength={100}
            />
          </div>

          {success && (
            <div className="border-2 border-black rounded-2xl bg-green-100 p-3 text-sm font-semibold">OS envoyé ✅</div>
          )}
          {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="bg-[#FFC300] border-2 border-black rounded-full font-bold shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_#000] text-black hover:bg-[#FFC300]"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                Émission…
              </span>
            ) : (
              "Émettre l'OS"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
