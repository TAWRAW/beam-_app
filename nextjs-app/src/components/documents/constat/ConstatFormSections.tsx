// Sections d'accordéon du Constat amiable DDE, insérées dans le formulaire
// de /apps/documents/generate (via useFormContext — la page fournit le FormProvider).
// Gère aussi le pré-remplissage Estale au changement de copropriété :
// colonne B (SDC + assurance), bloc syndic, adresse du sinistre, dates.
'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormContext, type Path } from 'react-hook-form'
import { Droplets, User, Building2, Search, PenLine, Loader2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import type { ConstatFormInput } from './constat-schema'
import type { ConstatCondoData, ConstatContract, ConstatOwner } from '@/lib/estale/constat-queries'
import {
  insuranceCandidates,
  pickDefaultInsurance,
  mapConstatFromEstale,
  applyInsurance,
  mapOwnerToPartieA,
  ownerLabel,
  type ConstatAgencyInfo,
} from './constat-mapping'

// Forme minimale du formulaire parent nécessaire à ce composant
type FormShape = {
  condoId?: string
  constat: ConstatFormInput
}

const NONE = '__none__' // Radix Select n'accepte pas value=""

function CText({ name, label, placeholder }: { name: string; label: string; placeholder?: string }) {
  const { control } = useFormContext<FormShape>()
  return (
    <FormField
      control={control}
      name={name as Path<FormShape>}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs text-app-fg-muted">{label}</FormLabel>
          <FormControl>
            <Input className="h-8 text-xs" placeholder={placeholder} {...field} value={(field.value as string) ?? ''} />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

function CSelect({
  name,
  label,
  options,
}: {
  name: string
  label: string
  options: { value: string; label: string }[]
}) {
  const { control } = useFormContext<FormShape>()
  return (
    <FormField
      control={control}
      name={name as Path<FormShape>}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs text-app-fg-muted">{label}</FormLabel>
          <Select
            value={(field.value as string) === '' || field.value === undefined ? NONE : (field.value as string)}
            onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
          >
            <FormControl>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  )
}

function COuiNon({ name, label }: { name: string; label: string }) {
  return (
    <CSelect
      name={name}
      label={label}
      options={[
        { value: 'oui', label: 'Oui' },
        { value: 'non', label: 'Non' },
      ]}
    />
  )
}

function CCheck({ name, label }: { name: string; label: string }) {
  const { control } = useFormContext<FormShape>()
  return (
    <FormField
      control={control}
      name={name as Path<FormShape>}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl>
            <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="text-xs font-normal cursor-pointer">{label}</FormLabel>
        </FormItem>
      )}
    />
  )
}

const VOUS_ETES_OPTIONS = [
  { value: 'locataire', label: 'Locataire / occupant non propriétaire' },
  { value: 'proprioOccupant', label: 'Propriétaire/copropriétaire occupant' },
  { value: 'proprioNonOccupant', label: 'Propriétaire/copropriétaire non occupant' },
  { value: 'syndic', label: 'Syndic' },
  { value: 'gerant', label: 'Gérant de l’immeuble' },
]

function PartieFields({ prefix }: { prefix: 'partieA' | 'partieB' }) {
  const { control, watch } = useFormContext<FormShape>()
  const vousEtes = watch(`constat.${prefix}.vousEtes` as Path<FormShape>) as string
  return (
    <div className="space-y-2">
      <CText name={`constat.${prefix}.nom`} label="Nom et prénom" />
      <CText name={`constat.${prefix}.adresse`} label="Adresse" />
      <div className="grid grid-cols-2 gap-2">
        <CText name={`constat.${prefix}.bat`} label="Bât." />
        <CText name={`constat.${prefix}.etage`} label="Étage" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CText name={`constat.${prefix}.mail`} label="Mail" />
        <CText name={`constat.${prefix}.tel`} label="Tél." />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CText name={`constat.${prefix}.assureur`} label="Assureur" />
        <CText name={`constat.${prefix}.contratNo`} label="Contrat n°" />
      </div>
      <CText name={`constat.${prefix}.sinistreNo`} label="Sinistre n°" />
      <div className="grid grid-cols-2 gap-2">
        <CText name={`constat.${prefix}.agent`} label="Agent/courtier" />
        <CText name={`constat.${prefix}.agentTel`} label="Tél. agent" />
      </div>
      <CText name={`constat.${prefix}.adresseAssureur`} label="Adresse assureur / agent / courtier" />
      <div className="grid grid-cols-3 gap-2">
        <COuiNon name={`constat.${prefix}.usageHabitation`} label="Local d'habitation ?" />
        <COuiNon name={`constat.${prefix}.resiliationBail`} label="Résiliation bail ?" />
        <COuiNon name={`constat.${prefix}.locationMeublee`} label="Meublé/saisonnier ?" />
      </div>
      <CSelect name={`constat.${prefix}.vousEtes`} label="Vous êtes" options={VOUS_ETES_OPTIONS} />
      {vousEtes === 'locataire' && (
        <FormField
          control={control}
          name={`constat.${prefix}.proprietaireCoordonnees` as Path<FormShape>}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs text-app-fg-muted">Nom et coordonnées du propriétaire ou du gérant</FormLabel>
              <FormControl>
                <Textarea className="min-h-[48px] text-xs resize-none" {...field} value={(field.value as string) ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      <COuiNon name={`constat.${prefix}.dommages`} label="Avez-vous subi des dommages ?" />
    </div>
  )
}

export function ConstatFormSections() {
  const { setValue, watch } = useFormContext<FormShape>()
  const condoId = watch('condoId')
  const causeVals = watch('constat.cause' as Path<FormShape>) as ConstatFormInput['cause'] | undefined

  const [condoData, setCondoData] = useState<ConstatCondoData | null>(null)
  const [agency, setAgency] = useState<ConstatAgencyInfo | null>(null)
  const [insurances, setInsurances] = useState<ConstatContract[]>([])
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string>('')
  const [loadingPrefill, setLoadingPrefill] = useState(false)
  const lastPrefilledCondo = useRef<string | null>(null)

  // Coordonnées agence Beamô (bloc syndic) — chargées une fois
  useEffect(() => {
    fetch('/api/estale/agency')
      .then((res) => res.json())
      .then((data) => {
        if (data.agency) {
          setAgency({
            name: data.agency.name,
            address: data.agency.address,
            addressL2: data.agency.addressL2,
            zipCode: data.agency.zipCode,
            city: data.agency.city,
            phone: data.agency.phone,
          })
        }
      })
      .catch(() => {})
  }, [])

  // Pré-remplissage au changement de copropriété (une seule fois par copro,
  // pour ne pas écraser les saisies manuelles à chaque re-render)
  useEffect(() => {
    if (!condoId || condoId === lastPrefilledCondo.current) return
    if (agency === null) return // attendre l'agence pour remplir le bloc syndic d'un coup
    lastPrefilledCondo.current = condoId
    setLoadingPrefill(true)
    fetch(`/api/estale/condos/constat?condoId=${condoId}`)
      .then((res) => res.json())
      .then((data) => {
        const condo: ConstatCondoData | null = data.condo
        if (!condo) return
        setCondoData(condo)
        const candidates = insuranceCandidates(condo.contracts)
        setInsurances(candidates)
        const defaultInsurance = pickDefaultInsurance(candidates)
        setSelectedInsuranceId(defaultInsurance?.id || '')
        for (const [path, value] of mapConstatFromEstale(condo, agency, defaultInsurance)) {
          setValue(`constat.${path}` as Path<FormShape>, value as never, { shouldDirty: true })
        }
      })
      .catch((e) => console.error('Erreur pré-remplissage constat:', e))
      .finally(() => setLoadingPrefill(false))
  }, [condoId, agency, setValue])

  const handleInsuranceChange = (id: string) => {
    setSelectedInsuranceId(id)
    const insurance = insurances.find((c) => c.id === id) || null
    for (const [path, value] of applyInsurance([], insurance)) {
      setValue(`constat.${path}` as Path<FormShape>, value as never, { shouldDirty: true })
    }
  }

  const handleOwnerPick = (ownerId: string) => {
    const owner = condoData?.owners.find((o) => o.id === ownerId)
    if (!owner) return
    for (const [path, value] of mapOwnerToPartieA(owner)) {
      setValue(`constat.${path}` as Path<FormShape>, value as never, { shouldDirty: true })
    }
  }

  return (
    <>
      {/* === SINISTRE === */}
      <AccordionItem value="constat-sinistre" className="border rounded-sm px-3">
        <AccordionTrigger className="py-2 hover:no-underline">
          <div className="flex items-center gap-2 text-sm">
            <Droplets className="h-4 w-4 text-app-fg-muted" />
            <span className="font-medium">Sinistre</span>
            {loadingPrefill && <Loader2 className="h-3 w-3 animate-spin text-app-fg-muted" />}
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <CText name="constat.sinistre.date" label="Date du dégât des eaux" placeholder="jj/mm/aaaa" />
            <CSelect
              name="constat.sinistre.typeImmeuble"
              label="Type"
              options={[
                { value: 'maison', label: 'Maison particulière' },
                { value: 'copro', label: 'Immeuble en copropriété' },
                { value: 'locatif', label: 'Immeuble locatif' },
              ]}
            />
          </div>
          <CText name="constat.sinistre.adresse" label="Adresse complète du lieu du sinistre" />
          <COuiNon name="constat.sinistre.moins10Ans" label="Immeuble construit depuis moins de 10 ans ?" />
          <CText name="constat.sinistre.syndicNom" label="Nom du syndic ou du gérant" />
          <div className="grid grid-cols-[2fr_1fr] gap-2">
            <CText name="constat.sinistre.syndicAdresse" label="Adresse du syndic" />
            <CText name="constat.sinistre.syndicTel" label="Tél. syndic" />
          </div>
          {process.env.NODE_ENV === 'development' && (
            <FormField
              name={'constat._calibrate' as Path<FormShape>}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-1 border-t border-dashed">
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="text-xs font-normal text-app-fg-muted">Calibrateur (dev)</FormLabel>
                </FormItem>
              )}
            />
          )}
        </AccordionContent>
      </AccordionItem>

      {/* === PARTIE A (adverse) === */}
      <AccordionItem value="constat-partie-a" className="border rounded-sm px-3">
        <AccordionTrigger className="py-2 hover:no-underline">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-app-fg-muted" />
            <span className="font-medium">Partie A</span>
            <span className="text-xs text-app-fg-faint ml-1">l’autre partie</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-1 space-y-2">
          {condoData && condoData.owners.length > 0 && (
            <div>
              <p className="text-xs text-app-fg-muted mb-1">Pré-remplir depuis un copropriétaire</p>
              <Select value="" onValueChange={handleOwnerPick}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choisir un copropriétaire…" />
                </SelectTrigger>
                <SelectContent>
                  {condoData.owners.map((o: ConstatOwner) => (
                    <SelectItem key={o.id} value={o.id}>{ownerLabel(o)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <PartieFields prefix="partieA" />
        </AccordionContent>
      </AccordionItem>

      {/* === PARTIE B (la copro / Beamô) === */}
      <AccordionItem value="constat-partie-b" className="border rounded-sm px-3">
        <AccordionTrigger className="py-2 hover:no-underline">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-app-fg-muted" />
            <span className="font-medium">Partie B</span>
            <span className="text-xs text-app-fg-faint ml-1">la copropriété (pré-remplie)</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-1 space-y-2">
          {insurances.length > 1 && (
            <div>
              <p className="text-xs text-app-fg-muted mb-1">Contrat d’assurance de la copro</p>
              <Select value={selectedInsuranceId} onValueChange={handleInsuranceChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choisir un contrat…" />
                </SelectTrigger>
                <SelectContent>
                  {insurances.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {[c.supplier?.name, c.label, c.reference].filter(Boolean).join(' — ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <PartieFields prefix="partieB" />
        </AccordionContent>
      </AccordionItem>

      {/* === CAUSE === */}
      <AccordionItem value="constat-cause" className="border rounded-sm px-3">
        <AccordionTrigger className="py-2 hover:no-underline">
          <div className="flex items-center gap-2 text-sm">
            <Search className="h-4 w-4 text-app-fg-muted" />
            <span className="font-medium">Cause du dégât des eaux</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-1 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <CSelect
              name="constat.cause.rechercheFuite"
              label="Recherche de fuite effectuée ?"
              options={[
                { value: 'oui', label: 'Oui' },
                { value: 'non', label: 'Non' },
              ]}
            />
            {causeVals?.rechercheFuite === 'oui' && (
              <CText name="constat.cause.rechercheFuiteParQui" label="Par qui ?" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <COuiNon name="constat.cause.causeIdentifiee" label="Cause identifiée ?" />
            <COuiNon name="constat.cause.causeReparee" label="Cause réparée ?" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <CSelect
              name="constat.cause.origine"
              label="Origine située chez"
              options={[
                { value: 'A', label: 'A' },
                { value: 'B', label: 'B' },
                { value: 'ailleurs', label: 'Ailleurs' },
              ]}
            />
            {causeVals?.origine === 'ailleurs' && (
              <CText name="constat.cause.origineAilleursPrecision" label="Préciser" />
            )}
          </div>

          <div className="space-y-1.5 pt-1 border-t">
            <p className="text-xs font-medium text-app-fg-muted pt-1">Il s’agit de :</p>
            <CCheck name="constat.cause.fuiteCanalisation" label="Fuite sur canalisation" />
            {causeVals?.fuiteCanalisation && (
              <div className="grid grid-cols-3 gap-2 pl-6">
                <CSelect
                  name="constat.cause.canalisationCommune"
                  label="Nature"
                  options={[
                    { value: 'commune', label: 'Commune' },
                    { value: 'privative', label: 'Privative' },
                  ]}
                />
                <CSelect
                  name="constat.cause.canalisationType"
                  label="Réseau"
                  options={[
                    { value: 'alimentation', label: 'Alimentation' },
                    { value: 'evacuation', label: 'Évacuation' },
                  ]}
                />
                <CSelect
                  name="constat.cause.canalisationAccessible"
                  label="Accès"
                  options={[
                    { value: 'accessible', label: 'Accessible' },
                    { value: 'nonAccessible', label: 'Non accessible' },
                  ]}
                />
              </div>
            )}
            <CCheck name="constat.cause.appareilEffetEau" label="Fuite ou débordement d’appareils à effet d’eau" />
            <CCheck name="constat.cause.cheneaux" label="Fuite ou débordement de chéneaux ou de gouttières" />
            <CCheck name="constat.cause.infiltration" label="Infiltrations" />
            {causeVals?.infiltration && (
              <div className="grid grid-cols-2 gap-1.5 pl-6">
                <CCheck name="constat.cause.infiltrationToiture" label="Toiture" />
                <CCheck name="constat.cause.infiltrationTerrasse" label="Terrasse" />
                <CCheck name="constat.cause.infiltrationFacade" label="Façade" />
                <CCheck name="constat.cause.infiltrationFenetre" label="Fenêtre / porte-fenêtre" />
                <CCheck name="constat.cause.infiltrationJoint" label="Joint d’étanchéité" />
              </div>
            )}
            <CCheck name="constat.cause.gel" label="Gel" />
            <CCheck name="constat.cause.autreCause" label="Autre cause" />
            {causeVals?.autreCause && (
              <div className="pl-6">
                <CText name="constat.cause.autreCauseLabel" label="Laquelle ?" />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-1 border-t">
            <COuiNon
              name="constat.cause.entrepreneurOrigine"
              label="Un entrepreneur / installateur / vendeur à l'origine ?"
            />
            {causeVals?.entrepreneurOrigine === 'oui' && (
              <>
                <CText name="constat.cause.entrepreneurPrecision" label="Préciser pourquoi" />
                <CText name="constat.cause.entrepreneurNomAdresse" label="Nom et adresse" />
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* === FAIT À / LE === */}
      <AccordionItem value="constat-pied" className="border rounded-sm px-3">
        <AccordionTrigger className="py-2 hover:no-underline">
          <div className="flex items-center gap-2 text-sm">
            <PenLine className="h-4 w-4 text-app-fg-muted" />
            <span className="font-medium">Fait à / le</span>
            <span className="text-xs text-app-fg-faint ml-1">signatures manuscrites</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <CText name="constat.pied.faitA" label="Fait à" />
            <CText name="constat.pied.faitLe" label="Le" placeholder="jj/mm/aaaa" />
          </div>
        </AccordionContent>
      </AccordionItem>
    </>
  )
}
