'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FileText, ExternalLink, Save, Trash2, Building2, Loader2, Calendar, Users, Settings2, Plus, Phone, PhoneCall, Zap, Droplets, Wrench, Search, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
} from '@/components/ui/form'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { SmartSupplierSelect } from '@/components/documents/SmartSupplierSelect'
import { DocumentPreview } from '@/components/documents/DocumentPreview'
import { ReglementInterieurTemplate } from '@/components/documents/templates/ReglementInterieurTemplate'
import { ContactsUtilesTemplate } from '@/components/documents/templates/ContactsUtilesTemplate'
import {
  type SupplierCondo,
  type CommuneContactsMap,
  type ContractEntry,
  type ContactsUtilesData,
  DOCUMENT_TYPE_COLORS,
  BuildingFeaturesSchema,
} from '@/schemas/document'
import { mockSuppliers, mockAgency } from '@/lib/mock-data'
import { computeEnedisPhone, normalizeCityKey, autoMatchContracts, EQUIPMENT_TYPES } from '@/lib/contacts-utils'

// Types de modèles de documents
type TemplateType = 'affiche' | 'reglement' | 'contacts'

const TEMPLATE_OPTIONS: { value: TemplateType; label: string }[] = [
  { value: 'affiche', label: 'Affiche Travaux' },
  { value: 'reglement', label: 'Règlement Intérieur' },
  { value: 'contacts', label: 'Les Contacts Utiles' },
]

// Schéma unifié pour le formulaire
const UnifiedFormSchema = z.object({
  // Type de template
  templateType: z.enum(['affiche', 'reglement', 'contacts']).default('affiche'),
  // Champs communs - Immeuble
  condoId: z.string().optional(),
  buildingNom: z.string().optional(),
  buildingAdresse: z.string().optional(),
  buildingCodePostal: z.string().optional(),
  buildingVille: z.string().optional(),
  // Champs Affiche Travaux (string to support custom categories from Réglages)
  documentType: z.string().default('general'),
  titre: z.string().optional(),
  description: z.string().optional(),
  dateTravaux: z.string().optional(),
  heureDebut: z.string().optional(),
  heureFin: z.string().optional(),
  showSupplierContactOnPreview: z.boolean().default(false),
  supplierMode: z.enum(['select', 'manual']).default('select'),
  supplierId: z.string().optional(),
  supplierNom: z.string().optional(),
  supplierTelephone: z.string().optional(),
  supplierEmail: z.string().optional(),
  supplierSpecialite: z.string().optional(),
  notes: z.string().optional(),
  // Champs Contacts Utiles
  gestionnaireNom: z.string().optional(),
  gestionnaireTelephone: z.string().optional(),
  gestionnaireEmail: z.string().optional(),
  enedisPhone: z.string().optional(),
  eauPrivative: z.boolean().default(false),
  eauFournisseur: z.string().optional(),
  eauPhone: z.string().optional(),
  mairieName: z.string().optional(),
  mairiePhone: z.string().optional(),
  dechetterieName: z.string().optional(),
  dechetteriePhone: z.string().optional(),
  dechetterieAdresse: z.string().optional(),
  dechetterieHoraires: z.string().optional(),
  contracts: z.array(z.object({
    equipmentType: z.string(),
    equipmentLabel: z.string(),
    supplierName: z.string(),
    supplierPhone: z.string().optional(),
  })).default([]),
  conseillers: z.array(z.object({
    nom: z.string(),
    specialite: z.string(),
    telephone: z.string().optional(),
  })).default([]),
  // Section visibility toggles
  showUrgences: z.boolean().default(true),
  showEnergie: z.boolean().default(true),
  showContracts: z.boolean().default(true),
  showConseillers: z.boolean().default(true),
  // Urgences contacts
  urgences: z.array(z.object({
    label: z.string(),
    numero: z.string(),
  })).default([
    { label: 'Pompiers', numero: '18' },
    { label: 'Police', numero: '17' },
    { label: 'SAMU', numero: '15' },
    { label: 'Urgences EU', numero: '112' },
  ]),
  // Blocs personnalisés Contacts Utiles
  customBlocks: z.array(z.object({
    id: z.string(),
    title: z.string().default(''),
    icon: z.string().default('Info'),
    lines: z.string().default(''), // lignes séparées par \n
    show: z.boolean().default(true),
  })).default([]),
  // Champs Règlement Intérieur
  features: BuildingFeaturesSchema,
  showPreambule: z.boolean().default(true),
  preambuleContent: z.string().default("Tout comportement bruyant est à éviter entre 22 h et 7 h. Les talons, pieds de chaises, appareils de télévision, radio et hi-fi doivent être réglés de façon à ne pas gêner le voisinage. Conformément à l'arrêté préfectoral relatif à la lutte contre le bruit de voisinage, les activités bruyantes (travaux) sont autorisées : en semaine de 8 h 30 à 12 h puis de 14 h 30 à 19 h 30 ; le samedi de 9 h à 12 h et de 14 h 30 à 19 h ; les dimanches et jours fériés de 10 h à 12 h (travaux légers uniquement). Le tapage nocturne (22 h - 7 h) est sanctionnable sans condition de durée ni de répétition. En cas de nuisance constatée, il convient de joindre les forces de l'ordre avant le syndic de copropriété."),
  showSecurite: z.boolean().default(true),
  securiteContent: z.string().default("Veillez à ne pas ouvrir à une personne que vous n'avez pas formellement identifiée ou qui ne vous rend pas visite. Assurez-vous que les portes d'accès soient bien fermées après votre passage. N'hésitez pas à signaler toute anomalie de fonctionnement au syndic ou, en cas d'urgence, aux forces de l'ordre."),
})

type UnifiedFormInput = z.infer<typeof UnifiedFormSchema>

// Catégories d'équipements
const FEATURE_CATEGORIES = {
  communs: {
    label: 'Parties Communes',
    icon: '🏢',
    features: [
      { key: 'hasElevator' as const, label: 'Ascenseur' },
      { key: 'hasStairs' as const, label: 'Escaliers' },
      { key: 'hasCorridors' as const, label: 'Couloirs' },
      { key: 'hasLandings' as const, label: 'Paliers' },
    ],
  },
  exterieurs: {
    label: 'Espaces Extérieurs',
    icon: '🌿',
    features: [
      { key: 'hasBalconies' as const, label: 'Balcons' },
      { key: 'hasTerraces' as const, label: 'Terrasses' },
      { key: 'hasPrivateGarden' as const, label: 'Jardins privatifs' },
      { key: 'hasCommonGarden' as const, label: 'Espaces verts communs' },
    ],
  },
  technique: {
    label: 'Locaux Techniques',
    icon: '🔧',
    features: [
      { key: 'hasTrashRoom' as const, label: 'Local poubelles' },
      { key: 'hasBikeRoom' as const, label: 'Local vélos' },
    ],
  },
  parking: {
    label: 'Stationnement',
    icon: '🚗',
    features: [
      { key: 'hasPrivateParking' as const, label: 'Parking privatif' },
      { key: 'hasVisitorParking' as const, label: 'Parking visiteurs' },
    ],
  },
  personnel: {
    label: 'Personnel',
    icon: '👤',
    features: [
      { key: 'hasCaretaker' as const, label: 'Gardien / Concierge' },
    ],
  },
  vieQuotidienne: {
    label: 'Vie Quotidienne',
    icon: '🐾',
    features: [
      { key: 'hasPets' as const, label: 'Animaux domestiques' },
    ],
  },
}

const CUSTOM_BLOCK_ICONS = [
  { value: 'Info', label: 'Information' },
  { value: 'Phone', label: 'Téléphone' },
  { value: 'Mail', label: 'Email' },
  { value: 'MapPin', label: 'Adresse / Lieu' },
  { value: 'Building2', label: 'Bâtiment / Société' },
  { value: 'User', label: 'Personne' },
  { value: 'Users', label: 'Groupe / Contacts' },
  { value: 'Wrench', label: 'Entretien' },
  { value: 'Shield', label: 'Sécurité' },
  { value: 'Key', label: 'Accès / Clés' },
  { value: 'Clock', label: 'Horaires' },
  { value: 'Car', label: 'Véhicule / Parking' },
  { value: 'Bike', label: 'Vélos' },
  { value: 'Leaf', label: 'Environnement' },
  { value: 'Zap', label: 'Énergie' },
  { value: 'Droplets', label: 'Eau' },
  { value: 'Flame', label: 'Gaz / Chauffage' },
  { value: 'Package', label: 'Livraisons' },
  { value: 'Star', label: 'Important' },
]

interface ApiCondo {
  id: string
  name: string
  address?: string
  zipCode?: string
  city?: string
}

interface ApiSupplier {
  id: string
  name: string
  phone?: string
  email?: string
  specialty?: string
  tags?: string[]
}

interface ApiAgencyLegal {
  siret?: string
  tvaNumber?: string
  capital?: string
  rcs?: string
}

interface ApiAgency {
  id: string
  name: string
  address?: string
  zipCode?: string
  city?: string
  phone?: string
  email?: string
  legal?: ApiAgencyLegal
}

type SavedTemplate = {
  name: string
  data: Partial<UnifiedFormInput>
  createdAt: string
}

const TEMPLATES_STORAGE_KEY = 'beamo_document_templates'


export default function DocumentGeneratePage() {
  const [error, setError] = useState<string | null>(null)
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([])
  const [selectedSavedTemplate, setSelectedSavedTemplate] = useState<string>('')
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  // Réglages article defaults from localStorage
  const [articleDefaults, setArticleDefaults] = useState<Record<string, string>>({})

  // Réglages affiche colors from localStorage
  const [afficheSettings, setAfficheSettings] = useState<{ colors: Record<string, string>; customCategories: { key: string; label: string; bg: string }[] }>({ colors: {}, customCategories: [] })

  // Réglages commune contacts from localStorage
  const [communeContacts, setCommuneContacts] = useState<CommuneContactsMap>({})

  // API data state
  const [condos, setCondos] = useState<ApiCondo[]>([])
  const [suppliers, setSuppliers] = useState<SupplierCondo[]>(mockSuppliers)
  const [agency, setAgency] = useState<ApiAgency | null>(null)
  const [defaultGestionnaire, setDefaultGestionnaire] = useState<{ name?: string; phone?: string; email?: string } | null>(null)
  const [loadingCondos, setLoadingCondos] = useState(true)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [apiConnected, setApiConnected] = useState(false)

  const form = useForm<UnifiedFormInput>({
    resolver: zodResolver(UnifiedFormSchema),
    defaultValues: {
      templateType: 'affiche',
      documentType: 'general',
      titre: 'AVIS DE TRAVAUX',
      description: '',
      dateTravaux: '',
      heureDebut: '08:00',
      heureFin: '17:00',
      showSupplierContactOnPreview: false,
      condoId: '',
      buildingNom: '',
      buildingAdresse: '',
      buildingCodePostal: '',
      buildingVille: '',
      supplierMode: 'select',
      supplierId: '',
      supplierNom: '',
      supplierTelephone: '',
      supplierEmail: '',
      supplierSpecialite: '',
      notes: '',
      // Contacts Utiles defaults
      gestionnaireNom: '',
      gestionnaireTelephone: '',
      gestionnaireEmail: '',
      enedisPhone: '',
      eauPrivative: false,
      eauFournisseur: '',
      eauPhone: '',
      mairieName: '',
      mairiePhone: '',
      dechetterieName: '',
      dechetteriePhone: '',
      dechetterieAdresse: '',
      dechetterieHoraires: '',
      contracts: [],
      conseillers: [],
      customBlocks: [],
      showUrgences: true,
      showEnergie: true,
      showContracts: true,
      showConseillers: true,
      urgences: [
        { label: 'Pompiers', numero: '18' },
        { label: 'Police', numero: '17' },
        { label: 'SAMU', numero: '15' },
        { label: 'Urgences EU', numero: '112' },
      ],
      features: {
        hasElevator: false,
        hasStairs: false,
        hasCorridors: false,
        hasLandings: false,
        hasBalconies: false,
        hasTerraces: false,
        hasPrivateGarden: false,
        hasCommonGarden: false,
        hasTrashRoom: false,
        hasBikeRoom: false,
        hasPrivateParking: false,
        hasVisitorParking: false,
        hasCaretaker: false,
        hasPets: false,
      },
      showPreambule: true,
      preambuleContent: "Tout comportement bruyant est à éviter entre 22 h et 7 h. Les talons, pieds de chaises, appareils de télévision, radio et hi-fi doivent être réglés de façon à ne pas gêner le voisinage. Conformément à l'arrêté préfectoral relatif à la lutte contre le bruit de voisinage, les activités bruyantes (travaux) sont autorisées : en semaine de 8 h 30 à 12 h puis de 14 h 30 à 19 h 30 ; le samedi de 9 h à 12 h et de 14 h 30 à 19 h ; les dimanches et jours fériés de 10 h à 12 h (travaux légers uniquement). Le tapage nocturne (22 h - 7 h) est sanctionnable sans condition de durée ni de répétition. En cas de nuisance constatée, il convient de joindre les forces de l'ordre avant le syndic de copropriété.",
      showSecurite: true,
      securiteContent: "Veillez à ne pas ouvrir à une personne que vous n'avez pas formellement identifiée ou qui ne vous rend pas visite. Assurez-vous que les portes d'accès soient bien fermées après votre passage. N'hésitez pas à signaler toute anomalie de fonctionnement au syndic ou, en cas d'urgence, aux forces de l'ordre.",
    },
    mode: 'onChange',
  })

  const watchedValues = form.watch()
  const selectedTemplate = watchedValues.templateType

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('beamo_generate_draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        form.reset({ ...form.getValues(), ...parsed })
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-apply condoId from draft once condos are loaded
  useEffect(() => {
    if (!loadingCondos && condos.length > 0) {
      try {
        const draft = localStorage.getItem('beamo_generate_draft')
        if (draft) {
          const parsed = JSON.parse(draft)
          if (parsed.condoId && condos.find(c => c.id === parsed.condoId)) {
            form.setValue('condoId', parsed.condoId)
          }
        }
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingCondos, condos])

  // Auto-save draft to localStorage on every change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('beamo_generate_draft', JSON.stringify(watchedValues))
      } catch {}
    }, 800)
    return () => clearTimeout(timer)
  }, [watchedValues])

  // Scale preview to fit container
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)

  useEffect(() => {
    const container = previewContainerRef.current
    if (!container) return

    const updateScale = () => {
      const containerWidth = container.clientWidth
      const padding = 64 // p-8 = 32px each side
      const availableWidth = containerWidth - padding
      const docWidth = 794
      const scale = Math.min(availableWidth / docWidth, 1)
      setPreviewScale(scale)
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Charger les modèles sauvegardés au montage
  useEffect(() => {
    const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY)
    if (stored) {
      try {
        setSavedTemplates(JSON.parse(stored))
      } catch (e) {
        console.error('Erreur chargement modèles:', e)
      }
    }
  }, [])

  // Charger les réglages par défaut des articles depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('beamo_reglages_reglement')
      if (stored) {
        setArticleDefaults(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Erreur chargement réglages articles:', e)
    }
    try {
      const stored = localStorage.getItem('beamo_reglages_affiche')
      if (stored) {
        setAfficheSettings(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Erreur chargement réglages affiche:', e)
    }
    try {
      const stored = localStorage.getItem('beamo_reglages_custom_blocks')
      if (stored) {
        const blocks = JSON.parse(stored)
        if (Array.isArray(blocks) && blocks.length > 0) {
          form.setValue('customBlocks', blocks)
        }
      }
    } catch (e) {
      console.error('Erreur chargement blocs par défaut:', e)
    }
    fetch('/api/settings/communes')
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setCommuneContacts(data)
          localStorage.setItem('beamo_reglages_communes', JSON.stringify(data))
        } else {
          try {
            const stored = localStorage.getItem('beamo_reglages_communes')
            if (stored) setCommuneContacts(JSON.parse(stored))
          } catch (e) {
            console.error('Erreur chargement communes:', e)
          }
        }
      })
      .catch(() => {
        try {
          const stored = localStorage.getItem('beamo_reglages_communes')
          if (stored) setCommuneContacts(JSON.parse(stored))
        } catch (e) {
          console.error('Erreur chargement communes:', e)
        }
      })
  }, [])

  // Build effective color map: default colors + overrides + custom categories
  const effectiveColorMap = useMemo(() => {
    const map: Record<string, { bg: string; label: string }> = {}
    // Start with defaults
    for (const [key, value] of Object.entries(DOCUMENT_TYPE_COLORS)) {
      map[key] = { ...value }
    }
    // Apply color overrides
    for (const [key, color] of Object.entries(afficheSettings.colors)) {
      if (map[key]) {
        map[key] = { ...map[key], bg: color }
      }
    }
    // Add custom categories
    for (const cat of afficheSettings.customCategories) {
      map[cat.key] = { bg: cat.bg, label: cat.label }
    }
    return map
  }, [afficheSettings])

  // Charger les données API au montage
  useEffect(() => {
    async function fetchCondos() {
      try {
        const response = await fetch('/api/estale/condos')
        const data = await response.json()
        if (data.condos && data.condos.length > 0) {
          setCondos(data.condos)
          setApiConnected(true)
        }
        if (data.gestionnaire) {
          setDefaultGestionnaire(data.gestionnaire)
        }
      } catch (e) {
        console.error('Erreur chargement copropriétés:', e)
      } finally {
        setLoadingCondos(false)
      }
    }

    async function fetchAgency() {
      try {
        const response = await fetch('/api/estale/agency')
        const data = await response.json()
        if (data.agency) {
          setAgency(data.agency)
        }
      } catch (e) {
        console.error('Erreur chargement infos agence:', e)
      }
    }

    async function fetchAllSuppliers() {
      try {
        const response = await fetch('/api/estale/suppliers')
        const data = await response.json()
        if (data.suppliers && data.suppliers.length > 0) {
          const transformedSuppliers: SupplierCondo[] = data.suppliers.map((s: ApiSupplier) => ({
            id: s.id,
            nom: s.name,
            telephone: s.phone || '',
            email: s.email || '',
            specialite: s.specialty || '',
            tags: s.tags || [],
          }))
          setSuppliers(transformedSuppliers)
        }
      } catch (e) {
        console.error('Erreur chargement prestataires:', e)
      }
    }

    fetchCondos()
    fetchAgency()
    fetchAllSuppliers()
  }, [])

  // Charger les prestataires quand une copropriété est sélectionnée
  const fetchSuppliers = useCallback(async (condoId: string, autoFillContracts = false) => {
    if (!condoId || !apiConnected) return

    setLoadingSuppliers(true)
    try {
      const response = await fetch(`/api/estale/suppliers?condoId=${condoId}`)
      const data = await response.json()

      if (data.suppliers && data.suppliers.length > 0) {
        const transformedSuppliers: SupplierCondo[] = data.suppliers.map((s: ApiSupplier) => ({
          id: s.id,
          nom: s.name,
          telephone: s.phone || '',
          email: s.email || '',
          specialite: s.specialty || '',
          tags: s.tags || [],
        }))
        setSuppliers(transformedSuppliers)
        // Auto-fill contracts when switching to contacts template
        if (autoFillContracts) {
          // Try Estale contracts first, fallback to tag-matching
          try {
            const contractsRes = await fetch(`/api/estale/condos/contracts?condoId=${condoId}`)
            const contractsData = await contractsRes.json()
            if (contractsData.contracts && contractsData.contracts.length > 0) {
              const estaleContracts: ContractEntry[] = contractsData.contracts.map((c: { label: string; category: string; supplierName: string; supplierPhone?: string }) => ({
                equipmentType: c.category || 'autre',
                equipmentLabel: c.label,
                supplierName: c.supplierName,
                supplierPhone: c.supplierPhone || '',
              }))
              form.setValue('contracts', estaleContracts)
            } else {
              form.setValue('contracts', autoMatchContracts(transformedSuppliers))
            }
          } catch {
            form.setValue('contracts', autoMatchContracts(transformedSuppliers))
          }
        }
      } else {
        setSuppliers(mockSuppliers)
      }
    } catch (e) {
      console.error('Erreur chargement prestataires:', e)
      setSuppliers(mockSuppliers)
    } finally {
      setLoadingSuppliers(false)
    }
  }, [apiConnected, form])

  // Gérer le changement de copropriété
  const handleCondoChange = (condoId: string) => {
    const condo = condos.find((c) => c.id === condoId)
    if (condo) {
      form.setValue('condoId', condoId)
      form.setValue('buildingNom', condo.name)
      form.setValue('buildingAdresse', condo.address || '')
      form.setValue('buildingCodePostal', condo.zipCode || '')
      form.setValue('buildingVille', condo.city || '')
      form.setValue('supplierId', '')
      form.setValue('supplierNom', '')
      form.setValue('supplierTelephone', '')
      form.setValue('supplierEmail', '')
      form.setValue('supplierSpecialite', '')
      const isContacts = form.getValues('templateType') === 'contacts'
      fetchSuppliers(condoId, isContacts)

      // Auto-fill contacts fields
      if (isContacts) {
        // Gestionnaire: fetch per-condo manager, fallback to default collaborator
        fetch(`/api/estale/condos/details?condoId=${condoId}`)
          .then(res => res.json())
          .then(data => {
            if (data.gestionnaire) {
              form.setValue('gestionnaireNom', data.gestionnaire.name || '')
              form.setValue('gestionnaireTelephone', data.gestionnaire.phone || '')
              form.setValue('gestionnaireEmail', data.gestionnaire.email || '')
            } else if (defaultGestionnaire) {
              form.setValue('gestionnaireNom', defaultGestionnaire.name || '')
              form.setValue('gestionnaireTelephone', defaultGestionnaire.phone || '')
              form.setValue('gestionnaireEmail', defaultGestionnaire.email || '')
            }
          })
          .catch(() => {
            if (defaultGestionnaire) {
              form.setValue('gestionnaireNom', defaultGestionnaire.name || '')
              form.setValue('gestionnaireTelephone', defaultGestionnaire.phone || '')
              form.setValue('gestionnaireEmail', defaultGestionnaire.email || '')
            }
          })
        // ENEDIS auto-calculation
        if (condo.zipCode) {
          form.setValue('enedisPhone', computeEnedisPhone(condo.zipCode))
        }
        // Commune contacts auto-fill
        if (condo.city) {
          const cityKey = normalizeCityKey(condo.city)
          const commune = communeContacts[cityKey]
          if (commune) {
            form.setValue('mairieName', commune.mairieName || '')
            form.setValue('mairiePhone', commune.mairiePhone || '')
            form.setValue('dechetterieName', commune.dechetterieName || '')
            form.setValue('dechetteriePhone', commune.dechetteriePhone || '')
            form.setValue('dechetterieAdresse', commune.dechetterieAdresse || '')
            form.setValue('dechetterieHoraires', commune.dechetterieHoraires || '')
            form.setValue('eauFournisseur', commune.eauFournisseur || '')
            form.setValue('eauPhone', commune.eauPhone || '')
            form.setValue('conseillers', commune.conseillers || [])
          }
        }
      }
    }
  }

  // Auto-detect contracts from suppliers — merges with existing (keeps manual entries)
  const handleAutoDetectContracts = () => {
    const matched = autoMatchContracts(suppliers)
    const existing = form.getValues('contracts')
    // Keep existing that aren't auto-matched types, then add matched
    const existingTypes = new Set(matched.map(m => m.equipmentType))
    const manual = existing.filter(c => !existingTypes.has(c.equipmentType))
    form.setValue('contracts', [...matched, ...manual])
  }

  // Add a contract from a supplier
  const handleAddSupplierAsContract = (supplier: SupplierCondo) => {
    const existing = form.getValues('contracts')
    // Try to guess equipment type from tags
    let bestType = ''
    let bestLabel = supplier.specialite || supplier.nom
    for (const [typeKey, equip] of Object.entries(EQUIPMENT_TYPES)) {
      if (supplier.tags?.some(tag => equip.matchTags.some(mt => tag.toUpperCase().includes(mt)))) {
        bestType = typeKey
        bestLabel = equip.label
        break
      }
    }
    form.setValue('contracts', [
      ...existing,
      {
        equipmentType: bestType || 'nettoyage',
        equipmentLabel: bestLabel || 'Nettoyage',
        supplierName: supplier.nom,
        supplierPhone: supplier.telephone || '',
      },
    ])
  }

  // Gérer le changement de type de template
  const handleTemplateChange = (value: TemplateType) => {
    form.setValue('templateType', value)
    if (value === 'affiche') {
      form.setValue('titre', 'AVIS DE TRAVAUX')
    }
    // Auto-fill contacts when switching to contacts template with a condo already selected
    if (value === 'contacts') {
      // Gestionnaire auto-fill from Estale (default collaborator)
      if (defaultGestionnaire) {
        form.setValue('gestionnaireNom', defaultGestionnaire.name || '')
        form.setValue('gestionnaireTelephone', defaultGestionnaire.phone || '')
        form.setValue('gestionnaireEmail', defaultGestionnaire.email || '')
      }
      const cp = form.getValues('buildingCodePostal')
      const ville = form.getValues('buildingVille')
      if (cp) {
        form.setValue('enedisPhone', computeEnedisPhone(cp))
      }
      if (ville) {
        const cityKey = normalizeCityKey(ville)
        const commune = communeContacts[cityKey]
        if (commune) {
          form.setValue('mairieName', commune.mairieName || '')
          form.setValue('mairiePhone', commune.mairiePhone || '')
          form.setValue('dechetterieName', commune.dechetterieName || '')
          form.setValue('dechetteriePhone', commune.dechetteriePhone || '')
          form.setValue('dechetterieAdresse', commune.dechetterieAdresse || '')
          form.setValue('dechetterieHoraires', commune.dechetterieHoraires || '')
          form.setValue('eauFournisseur', commune.eauFournisseur || '')
          form.setValue('eauPhone', commune.eauPhone || '')
          form.setValue('conseillers', commune.conseillers || [])
        }
      }
      // Auto-fill contracts: try Estale first, fallback to tag-matching
      if (form.getValues('contracts').length === 0) {
        const condoId = form.getValues('condoId')
        if (condoId) {
          fetch(`/api/estale/condos/contracts?condoId=${condoId}`)
            .then(res => res.json())
            .then(data => {
              if (data.contracts && data.contracts.length > 0) {
                const estaleContracts: ContractEntry[] = data.contracts.map((c: { label: string; category: string; supplierName: string; supplierPhone?: string }) => ({
                  equipmentType: c.category || 'autre',
                  equipmentLabel: c.label,
                  supplierName: c.supplierName,
                  supplierPhone: c.supplierPhone || '',
                }))
                form.setValue('contracts', estaleContracts)
              } else if (suppliers.length > 0) {
                form.setValue('contracts', autoMatchContracts(suppliers))
              }
            })
            .catch(() => {
              if (suppliers.length > 0) {
                form.setValue('contracts', autoMatchContracts(suppliers))
              }
            })
        } else if (suppliers.length > 0) {
          form.setValue('contracts', autoMatchContracts(suppliers))
        }
      }
    }
  }

  // Sauvegarder un modèle
  const handleSaveTemplate = () => {
    const name = newTemplateName.trim()
    if (!name) {
      setError('Veuillez saisir un nom pour le modèle.')
      return
    }

    const newTemplate: SavedTemplate = {
      name,
      data: watchedValues,
      createdAt: new Date().toISOString(),
    }

    const existingIndex = savedTemplates.findIndex((t) => t.name === name)
    let updatedTemplates: SavedTemplate[]

    if (existingIndex >= 0) {
      updatedTemplates = [...savedTemplates]
      updatedTemplates[existingIndex] = newTemplate
    } else {
      updatedTemplates = [...savedTemplates, newTemplate]
    }

    setSavedTemplates(updatedTemplates)
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates))
    setNewTemplateName('')
    setShowSaveInput(false)
    setSelectedSavedTemplate(name)
    setError(null)
  }

  // Charger un modèle sauvegardé
  const handleLoadSavedTemplate = (templateName: string) => {
    const template = savedTemplates.find((t) => t.name === templateName)
    if (template) {
      Object.entries(template.data).forEach(([key, value]) => {
        if (value !== undefined) {
          form.setValue(key as keyof UnifiedFormInput, value as any)
        }
      })
      setSelectedSavedTemplate(templateName)
    }
  }

  // Supprimer un modèle sauvegardé
  const handleDeleteTemplate = () => {
    if (!selectedSavedTemplate) return

    const updatedTemplates = savedTemplates.filter((t) => t.name !== selectedSavedTemplate)
    setSavedTemplates(updatedTemplates)
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates))
    setSelectedSavedTemplate('')
  }

  const handleGeneratePDF = async () => {
    setError(null)
    const dataToStore: Record<string, unknown> = {
      ...watchedValues,
      articleContents: articleDefaults,
      afficheColorMap: effectiveColorMap,
    }
    // Add contacts-specific data
    if (watchedValues.templateType === 'contacts') {
      dataToStore.syndicNom = agency?.name || 'Beamô'
      dataToStore.syndicAdresse = agency ? [agency.address, agency.zipCode, agency.city].filter(Boolean).join(' ') : ''
      dataToStore.syndicTelephone = agency?.phone || ''
      dataToStore.syndicEmail = agency?.email || ''
      dataToStore.contactsAgency = agency ? {
        nom: agency.name,
        adresse: agency.address || '',
        codePostal: agency.zipCode || '',
        ville: agency.city || '',
        telephone: agency.phone || '',
        email: agency.email || '',
        legal: agency.legal ? {
          siret: agency.legal.siret,
          tvaNumber: agency.legal.tvaNumber,
          capital: agency.legal.capital,
          rcs: agency.legal.rcs,
        } : undefined,
      } : undefined
    }
    sessionStorage.setItem('documentPreviewData', JSON.stringify(dataToStore))
    window.open('/documents/preview', '_blank')
  }

  // Résumé de l'immeuble sélectionné
  const buildingSummary = watchedValues.buildingNom
    ? `${watchedValues.buildingNom}`
    : 'Non sélectionné'

  // Résumé du prestataire
  const supplierSummary = watchedValues.supplierNom
    ? `${watchedValues.supplierNom}${watchedValues.supplierSpecialite ? ` (${watchedValues.supplierSpecialite})` : ''}`
    : 'Non sélectionné'

  // Compter les équipements sélectionnés
  const selectedFeaturesCount = Object.values(watchedValues.features || {}).filter(Boolean).length

  return (
    <div className="h-screen grid grid-cols-[35%_65%] overflow-hidden">
      {/* ========== PANNEAU GAUCHE : FORMULAIRE ========== */}
      <div className="flex flex-col h-full border-r bg-white">
        {/* Header avec titre et modèles sauvegardés */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-600" />
            <span className="font-semibold text-sm">Générateur</span>
          </div>
          <div className="flex items-center gap-1">
            <Select value={selectedSavedTemplate} onValueChange={handleLoadSavedTemplate}>
              <SelectTrigger className="w-[100px] h-7 text-xs">
                <SelectValue placeholder="Modèle" />
              </SelectTrigger>
              <SelectContent>
                {savedTemplates.map((t) => (
                  <SelectItem key={t.name} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSavedTemplate && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDeleteTemplate}>
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            )}
            {showSaveInput ? (
              <>
                <Input
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Nom"
                  className="w-20 h-7 text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                />
                <Button size="icon" className="h-7 w-7" onClick={handleSaveTemplate}>
                  <Save className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSaveInput(true)}>
                <Save className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden px-4 py-3 pr-2">
          <Form {...form}>
            <form className="space-y-3">
              {/* === SÉLECTEUR DE MODÈLE === */}
              <FormField
                control={form.control}
                name="templateType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-slate-600 font-semibold">Type de document</FormLabel>
                    <Select value={field.value} onValueChange={(v) => handleTemplateChange(v as TemplateType)}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm font-medium bg-[#FFC300]/10 border-[#FFC300]">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPLATE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* === CHAMPS SPÉCIFIQUES AFFICHE TRAVAUX === */}
              {selectedTemplate === 'affiche' && (
                <>
                  {/* Type d'affichage - Sémantique couleur */}
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-600">Type d'affichage</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-8 text-sm">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full border border-black/20"
                                  style={{ backgroundColor: effectiveColorMap[field.value]?.bg || '#FFC300' }}
                                />
                                <SelectValue placeholder="Sélectionner un type" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(effectiveColorMap).map(([key, { bg, label }]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full border border-black/20"
                                    style={{ backgroundColor: bg }}
                                  />
                                  <span>{label}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  {/* Titre et Description */}
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="titre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-slate-600">Titre du document</FormLabel>
                          <FormControl>
                            <Input className="h-8 text-sm" placeholder="AVIS DE TRAVAUX" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-slate-600">Description des travaux</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[60px] text-sm resize-none"
                              placeholder="Décrivez les travaux..."
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Accordéons */}
              <Accordion type="single" collapsible defaultValue="contexte" className="space-y-2">
                {/* Accordéon Contexte - TOUJOURS VISIBLE */}
                <AccordionItem value="contexte" className="border rounded-sm px-3">
                  <AccordionTrigger className="py-2 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">Copropriété</span>
                      <span className="text-xs text-slate-400 ml-2 truncate max-w-[180px]">{buildingSummary}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pt-1">
                    <div className="space-y-2">
                      <Select
                        value={watchedValues.condoId || ''}
                        onValueChange={handleCondoChange}
                        disabled={loadingCondos}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={loadingCondos ? 'Chargement...' : apiConnected ? 'Sélectionner une copropriété...' : 'Aucune copropriété (API non configurée)'} />
                        </SelectTrigger>
                        <SelectContent>
                          {condos.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}{c.city ? ` — ${c.city}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="buildingNom"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input className="h-8 text-xs" placeholder="Nom immeuble" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buildingAdresse"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input className="h-8 text-xs" placeholder="Adresse" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={form.control}
                          name="buildingCodePostal"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input className="h-8 text-xs" placeholder="Code postal" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="buildingVille"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input className="h-8 text-xs" placeholder="Ville" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Accordéon Planning - AFFICHE UNIQUEMENT */}
                {selectedTemplate === 'affiche' && (
                  <AccordionItem value="planning" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Planning</span>
                        {watchedValues.dateTravaux && (
                          <span className="text-xs text-slate-400 ml-2">
                            {watchedValues.dateTravaux} • {watchedValues.heureDebut}-{watchedValues.heureFin}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="grid grid-cols-3 gap-2">
                        <FormField
                          control={form.control}
                          name="dateTravaux"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500">Date</FormLabel>
                              <FormControl>
                                <Input type="date" className="h-8 text-xs" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="heureDebut"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500">Début</FormLabel>
                              <FormControl>
                                <Input type="time" className="h-8 text-xs" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="heureFin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-slate-500">Fin</FormLabel>
                              <FormControl>
                                <Input type="time" className="h-8 text-xs" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Accordéon Prestataire - AFFICHE UNIQUEMENT */}
                {selectedTemplate === 'affiche' && (
                  <AccordionItem value="prestataire" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Prestataire</span>
                        <span className="text-xs text-slate-400 ml-2 truncate max-w-[180px]">{supplierSummary}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      {loadingSuppliers ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Chargement...
                        </div>
                      ) : (
                        <SmartSupplierSelect suppliers={suppliers} defaultTag="PLOMBERIE" name="supplier" />
                      )}
                      <FormField
                        control={form.control}
                        name="showSupplierContactOnPreview"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 mt-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-xs text-slate-600 font-normal cursor-pointer">
                              Afficher les coordonnées sur le document
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Accordéon Articles de base - RÈGLEMENT UNIQUEMENT */}
                {selectedTemplate === 'reglement' && (
                  <AccordionItem value="articles-base" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Articles de base</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-4">
                        {/* Bruits & Nuisances */}
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="showPreambule"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-xs font-semibold text-slate-700 cursor-pointer">
                                  Bruits & Nuisances
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          {watchedValues.showPreambule && (
                            <FormField
                              control={form.control}
                              name="preambuleContent"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Textarea
                                      className="min-h-[80px] text-xs resize-y"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>

                        {/* Sécurité */}
                        <div className="space-y-2">
                          <FormField
                            control={form.control}
                            name="showSecurite"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="text-xs font-semibold text-slate-700 cursor-pointer">
                                  Sécurité
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          {watchedValues.showSecurite && (
                            <FormField
                              control={form.control}
                              name="securiteContent"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Textarea
                                      className="min-h-[60px] text-xs resize-y"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Accordéon Équipements - RÈGLEMENT UNIQUEMENT */}
                {selectedTemplate === 'reglement' && (
                  <AccordionItem value="equipements" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm">
                        <Settings2 className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Équipements</span>
                        <span className="text-xs bg-[#FFC300] text-black px-2 py-0.5 rounded-full ml-2">
                          {selectedFeaturesCount}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-4">
                        {Object.entries(FEATURE_CATEGORIES).map(([categoryKey, category]) => (
                          <div key={categoryKey} className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              <span>{category.icon}</span>
                              <span>{category.label}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {category.features.map((feature) => (
                                <FormField
                                  key={feature.key}
                                  control={form.control}
                                  name={`features.${feature.key}`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center justify-between gap-2 rounded-md border p-2 bg-slate-50">
                                      <FormLabel className="text-xs font-normal cursor-pointer flex-1">
                                        {feature.label}
                                      </FormLabel>
                                      <FormControl>
                                        <Switch
                                          checked={field.value}
                                          onCheckedChange={field.onChange}
                                          className="data-[state=checked]:bg-[#FFC300]"
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* ========== SECTIONS CONTACTS UTILES ========== */}

                {/* Accordéon Syndic & Gestionnaire - CONTACTS UNIQUEMENT */}
                {selectedTemplate === 'contacts' && (
                  <AccordionItem value="syndic-gestionnaire" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Syndic & Gestionnaire</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-3">
                        {/* Syndic (read-only from agency) */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Syndic</p>
                          <div className="bg-slate-50 rounded-md p-2 text-xs text-slate-700 space-y-0.5">
                            <p>{agency?.name || 'Non connecté à l\'API'}</p>
                            {agency?.phone && <p>{agency.phone}</p>}
                            {agency?.email && <p>{agency.email}</p>}
                          </div>
                        </div>
                        {/* Gestionnaire (manual) */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Gestionnaire</p>
                          <div className="space-y-2">
                            <FormField
                              control={form.control}
                              name="gestionnaireNom"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input className="h-8 text-xs" placeholder="Nom du gestionnaire" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <FormField
                                control={form.control}
                                name="gestionnaireTelephone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input className="h-8 text-xs" placeholder="Téléphone" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="gestionnaireEmail"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input className="h-8 text-xs" placeholder="Email" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Accordéon Contacts communaux - CONTACTS UNIQUEMENT */}
                {selectedTemplate === 'contacts' && (
                  <AccordionItem value="contacts-communaux" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Contacts communaux</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-3">
                        {/* Hint if commune not configured */}
                        {watchedValues.buildingVille && !communeContacts[normalizeCityKey(watchedValues.buildingVille)] && (
                          <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
                            Commune &quot;{watchedValues.buildingVille}&quot; non configurée dans Réglages. Les champs ci-dessous sont à remplir manuellement.
                          </p>
                        )}

                        {/* Mairie */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Mairie</p>
                          <div className="grid grid-cols-2 gap-2">
                            <FormField
                              control={form.control}
                              name="mairieName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input className="h-8 text-xs" placeholder="Nom" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="mairiePhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input className="h-8 text-xs" placeholder="Téléphone" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* ENEDIS (auto, read-only) */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> ENEDIS
                          </p>
                          <FormField
                            control={form.control}
                            name="enedisPhone"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input className="h-8 text-xs bg-slate-50" placeholder="Auto-calculé depuis le code postal" readOnly {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Eau (conditional) */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                              <Droplets className="h-3 w-3" /> Eau privative
                            </p>
                            <FormField
                              control={form.control}
                              name="eauPrivative"
                              render={({ field }) => (
                                <FormItem className="space-y-0">
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      className="data-[state=checked]:bg-[#FFC300]"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          {watchedValues.eauPrivative && (
                            <div className="grid grid-cols-2 gap-2">
                              <FormField
                                control={form.control}
                                name="eauFournisseur"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input className="h-8 text-xs" placeholder="Fournisseur" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="eauPhone"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input className="h-8 text-xs" placeholder="Téléphone" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}
                        </div>

                        {/* Déchetterie */}
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">Déchetterie</p>
                          {suppliers.length > 0 && (
                            <Select
                              value=""
                              onValueChange={(supplierId) => {
                                const s = suppliers.find(sup => sup.id === supplierId)
                                if (s) {
                                  form.setValue('dechetterieName', s.nom)
                                  form.setValue('dechetteriePhone', s.telephone || '')
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs mb-2">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <Users className="h-3 w-3" />
                                  <span>Pré-remplir depuis Estale...</span>
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {suppliers.map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.nom}{s.specialite ? ` (${s.specialite})` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <FormField
                              control={form.control}
                              name="dechetterieName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input className="h-8 text-xs" placeholder="Nom" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="dechetteriePhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input className="h-8 text-xs" placeholder="Téléphone" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="dechetterieAdresse"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input className="h-8 text-xs" placeholder="Adresse" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="dechetterieHoraires"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input className="h-8 text-xs" placeholder="Horaires" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Accordéon Urgences - CONTACTS UNIQUEMENT */}
                {selectedTemplate === 'contacts' && (
                  <AccordionItem value="urgences" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm flex-1">
                        <PhoneCall className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Urgences</span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2">
                          {watchedValues.urgences?.length ?? 0}
                        </span>
                        <button
                          type="button"
                          className="ml-auto mr-2 text-slate-400 hover:text-slate-700"
                          title={watchedValues.showUrgences ? 'Masquer du document' : 'Afficher dans le document'}
                          onClick={e => { e.stopPropagation(); form.setValue('showUrgences', !watchedValues.showUrgences) }}
                        >
                          {watchedValues.showUrgences ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-slate-300" />}
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-2">
                        {(watchedValues.urgences || []).map((u, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Input
                              className="h-7 text-xs w-20 shrink-0"
                              placeholder="Numéro"
                              value={u.numero}
                              onChange={e => {
                                const updated = [...(watchedValues.urgences || [])]
                                updated[idx] = { ...updated[idx], numero: e.target.value }
                                form.setValue('urgences', updated)
                              }}
                            />
                            <Input
                              className="h-7 text-xs flex-1"
                              placeholder="Label (ex: Pompiers)"
                              value={u.label}
                              onChange={e => {
                                const updated = [...(watchedValues.urgences || [])]
                                updated[idx] = { ...updated[idx], label: e.target.value }
                                form.setValue('urgences', updated)
                              }}
                            />
                            <button
                              type="button"
                              className="text-slate-300 hover:text-red-500"
                              onClick={() => {
                                const updated = (watchedValues.urgences || []).filter((_, i) => i !== idx)
                                form.setValue('urgences', updated)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 mt-1"
                          onClick={() => form.setValue('urgences', [...(watchedValues.urgences || []), { label: '', numero: '' }])}
                        >
                          <Plus className="h-3 w-3" /> Ajouter un numéro
                        </button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Accordéon Contrats d'entretien - CONTACTS UNIQUEMENT */}
                {selectedTemplate === 'contacts' && (
                  <AccordionItem value="contrats" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm flex-1">
                        <Wrench className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Contrats d'entretien</span>
                        {watchedValues.contracts.length > 0 && (
                          <span className="text-xs bg-[#FFC300] text-black px-2 py-0.5 rounded-full ml-2">
                            {watchedValues.contracts.length}
                          </span>
                        )}
                        <button
                          type="button"
                          className="ml-auto mr-2 text-slate-400 hover:text-slate-700"
                          title={watchedValues.showContracts ? 'Masquer du document' : 'Afficher dans le document'}
                          onClick={e => { e.stopPropagation(); form.setValue('showContracts', !watchedValues.showContracts) }}
                        >
                          {watchedValues.showContracts ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-slate-300" />}
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-2">
                        {/* Auto-detect button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs w-full"
                          onClick={handleAutoDetectContracts}
                        >
                          <Search className="h-3 w-3 mr-1.5" />
                          Auto-détecter depuis les fournisseurs
                        </Button>

                        {/* Contract list — 2-line layout per contract */}
                        {watchedValues.contracts.map((contract, idx) => (
                          <div key={idx} className="border rounded-md p-2 bg-slate-50 space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Select
                                value={contract.equipmentType}
                                onValueChange={(v) => {
                                  const updated = [...watchedValues.contracts]
                                  updated[idx] = { ...updated[idx], equipmentType: v, equipmentLabel: EQUIPMENT_TYPES[v]?.label || v }
                                  form.setValue('contracts', updated)
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs flex-1">
                                  <SelectValue placeholder="Type d'équipement" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(EQUIPMENT_TYPES).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 shrink-0"
                                onClick={() => {
                                  const updated = watchedValues.contracts.filter((_, i) => i !== idx)
                                  form.setValue('contracts', updated)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                list="estale-suppliers-datalist"
                                className="h-7 text-xs flex-1"
                                placeholder="Fournisseur (taper pour suggérer)"
                                value={contract.supplierName}
                                onChange={(e) => {
                                  const updated = [...watchedValues.contracts]
                                  const match = suppliers.find(s => s.nom === e.target.value)
                                  updated[idx] = {
                                    ...updated[idx],
                                    supplierName: e.target.value,
                                    supplierPhone: match?.telephone || updated[idx].supplierPhone || '',
                                  }
                                  form.setValue('contracts', updated)
                                }}
                              />
                              <Input
                                className="h-7 text-xs w-[120px]"
                                placeholder="Téléphone"
                                value={contract.supplierPhone || ''}
                                onChange={(e) => {
                                  const updated = [...watchedValues.contracts]
                                  updated[idx] = { ...updated[idx], supplierPhone: e.target.value }
                                  form.setValue('contracts', updated)
                                }}
                              />
                            </div>
                          </div>
                        ))}

                        {/* Add from suppliers list */}
                        {suppliers.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold mt-3 mb-1">Ajouter un fournisseur Estale</p>
                            <div className="max-h-[150px] overflow-y-auto space-y-1 border rounded-md p-1.5">
                              {suppliers
                                .filter(s => !watchedValues.contracts.some(c => c.supplierName === s.nom))
                                .map((s) => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className="flex items-center justify-between w-full text-left text-xs px-2 py-1.5 rounded hover:bg-slate-100 transition-colors"
                                    onClick={() => handleAddSupplierAsContract(s)}
                                  >
                                    <span className="font-medium truncate">{s.nom}</span>
                                    <span className="text-slate-400 text-[10px] ml-2 shrink-0">
                                      {s.tags?.slice(0, 2).join(', ') || s.specialite || ''}
                                    </span>
                                  </button>
                                ))}
                              {suppliers.filter(s => !watchedValues.contracts.some(c => c.supplierName === s.nom)).length === 0 && (
                                <p className="text-[10px] text-slate-400 italic py-1 text-center">Tous les fournisseurs ont été ajoutés</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Manual add */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            form.setValue('contracts', [
                              ...watchedValues.contracts,
                              { equipmentType: 'ascenseur', equipmentLabel: 'Ascenseur', supplierName: '', supplierPhone: '' },
                            ])
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1.5" />
                          Ajouter manuellement
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Accordéon Conseillers travaux - CONTACTS UNIQUEMENT */}
                {selectedTemplate === 'contacts' && (
                  <AccordionItem value="conseillers" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm flex-1">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Conseillers travaux</span>
                        {watchedValues.conseillers.length > 0 && (
                          <span className="text-xs bg-[#FFC300] text-black px-2 py-0.5 rounded-full ml-2">
                            {watchedValues.conseillers.length}
                          </span>
                        )}
                        <button
                          type="button"
                          className="ml-auto mr-2 text-slate-400 hover:text-slate-700"
                          title={watchedValues.showConseillers ? 'Masquer du document' : 'Afficher dans le document'}
                          onClick={e => { e.stopPropagation(); form.setValue('showConseillers', !watchedValues.showConseillers) }}
                        >
                          {watchedValues.showConseillers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-slate-300" />}
                        </button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-2">
                        {watchedValues.conseillers.map((conseiller, idx) => (
                          <div key={idx} className="flex items-center gap-2 border rounded-md p-2 bg-slate-50">
                            <Input
                              className="h-7 text-xs flex-1"
                              placeholder="Spécialité"
                              value={conseiller.specialite}
                              onChange={(e) => {
                                const updated = [...watchedValues.conseillers]
                                updated[idx] = { ...updated[idx], specialite: e.target.value }
                                form.setValue('conseillers', updated)
                              }}
                            />
                            <Input
                              list="estale-suppliers-datalist"
                              className="h-7 text-xs flex-1"
                              placeholder="Nom (taper pour suggérer)"
                              value={conseiller.nom}
                              onChange={(e) => {
                                const updated = [...watchedValues.conseillers]
                                const match = suppliers.find(s => s.nom === e.target.value)
                                updated[idx] = {
                                  ...updated[idx],
                                  nom: e.target.value,
                                  telephone: match ? (match.telephone || updated[idx].telephone || '') : updated[idx].telephone || '',
                                  specialite: match ? (match.tags[0] || match.specialite || updated[idx].specialite || '') : updated[idx].specialite,
                                }
                                form.setValue('conseillers', updated)
                              }}
                            />
                            <Input
                              className="h-7 text-xs w-24"
                              placeholder="Tél."
                              value={conseiller.telephone || ''}
                              onChange={(e) => {
                                const updated = [...watchedValues.conseillers]
                                updated[idx] = { ...updated[idx], telephone: e.target.value }
                                form.setValue('conseillers', updated)
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 shrink-0"
                              onClick={() => {
                                const updated = watchedValues.conseillers.filter((_, i) => i !== idx)
                                form.setValue('conseillers', updated)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            form.setValue('conseillers', [
                              ...watchedValues.conseillers,
                              { nom: '', specialite: '', telephone: '' },
                            ])
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1.5" />
                          Ajouter un conseiller
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* Blocs personnalisés - CONTACTS UNIQUEMENT */}
                {selectedTemplate === 'contacts' && (
                  <AccordionItem value="custom-blocks" className="border rounded-sm px-3">
                    <AccordionTrigger className="py-2 hover:no-underline">
                      <div className="flex items-center gap-2 text-sm flex-1">
                        <Plus className="h-4 w-4 text-slate-500" />
                        <span className="font-medium">Blocs personnalisés</span>
                        {(watchedValues.customBlocks?.length ?? 0) > 0 && (
                          <span className="text-xs bg-[#FFC300] text-black px-2 py-0.5 rounded-full ml-2">
                            {watchedValues.customBlocks.length}
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-3 pt-1">
                      <div className="space-y-3">
                        {watchedValues.customBlocks?.map((block, idx) => (
                          <div key={block.id} className="border rounded-md p-2 bg-slate-50 space-y-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="text-slate-400 hover:text-slate-700 shrink-0"
                                title={block.show ? 'Masquer du document' : 'Afficher dans le document'}
                                onClick={() => {
                                  const updated = [...watchedValues.customBlocks]
                                  updated[idx] = { ...updated[idx], show: !updated[idx].show }
                                  form.setValue('customBlocks', updated)
                                }}
                              >
                                {block.show ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-slate-300" />}
                              </button>
                              <Select
                                value={block.icon}
                                onValueChange={(v) => {
                                  const updated = [...watchedValues.customBlocks]
                                  updated[idx] = { ...updated[idx], icon: v }
                                  form.setValue('customBlocks', updated)
                                }}
                              >
                                <SelectTrigger className="h-7 text-xs w-36 shrink-0">
                                  <SelectValue placeholder="Icône" />
                                </SelectTrigger>
                                <SelectContent>
                                  {CUSTOM_BLOCK_ICONS.map(ic => (
                                    <SelectItem key={ic.value} value={ic.value} className="text-xs">
                                      {ic.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                className="h-7 text-xs flex-1"
                                placeholder="Titre du bloc"
                                value={block.title}
                                onChange={(e) => {
                                  const updated = [...watchedValues.customBlocks]
                                  updated[idx] = { ...updated[idx], title: e.target.value }
                                  form.setValue('customBlocks', updated)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 shrink-0"
                                onClick={() => {
                                  form.setValue('customBlocks', watchedValues.customBlocks.filter((_, i) => i !== idx))
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <Textarea
                              className="text-xs min-h-[60px] resize-none"
                              placeholder={"Corps du texte..."}
                              value={block.lines}
                              onChange={(e) => {
                                const updated = [...watchedValues.customBlocks]
                                updated[idx] = { ...updated[idx], lines: e.target.value }
                                form.setValue('customBlocks', updated)
                              }}
                            />
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            form.setValue('customBlocks', [
                              ...(watchedValues.customBlocks || []),
                              { id: crypto.randomUUID(), title: '', icon: 'Info', lines: '', show: true },
                            ])
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1.5" />
                          Ajouter un bloc
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>

              {/* Datalist fournisseurs Estale — hors Accordion pour garantir présence dans le DOM */}
              <datalist id="estale-suppliers-datalist">
                {suppliers.map(s => (
                  <option key={s.id} value={s.nom} />
                ))}
              </datalist>

              {/* Notes - AFFICHE UNIQUEMENT */}
              {selectedTemplate === 'affiche' && (
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-600">Notes (optionnel)</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-[40px] text-sm resize-none"
                          placeholder="Informations complémentaires..."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>

        {/* Footer avec bouton */}
        <div className="px-4 py-3 border-t bg-slate-50">
          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
          <Button onClick={handleGeneratePDF} className="w-full h-9 bg-[#FFC300] text-black hover:bg-[#e6b000]">
            <ExternalLink className="h-4 w-4 mr-2" />
            {selectedTemplate === 'affiche' ? 'Ouvrir et imprimer PDF' : selectedTemplate === 'contacts' ? 'Générer les Contacts Utiles' : 'Générer le Règlement'}
          </Button>
        </div>
      </div>

      {/* ========== PANNEAU DROIT : APERÇU ========== */}
      <div ref={previewContainerRef} className="flex-1 bg-slate-100 overflow-y-auto p-8">
        <div style={{ width: 794 * previewScale, margin: '0 auto' }}>
          {selectedTemplate === 'affiche' ? (
            <div
              className="shadow-2xl bg-white"
              style={{
                width: '794px',
                minHeight: '1123px',
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <DocumentPreview
                data={watchedValues}
                building={{
                  nom: watchedValues.buildingNom || '',
                  adresse: watchedValues.buildingAdresse || '',
                  codePostal: watchedValues.buildingCodePostal || '',
                  ville: watchedValues.buildingVille || '',
                }}
                agency={agency ? {
                  nom: agency.name,
                  adresse: agency.address || '',
                  codePostal: agency.zipCode || '',
                  ville: agency.city || '',
                  telephone: agency.phone || '',
                  email: agency.email || '',
                  legal: agency.legal ? {
                    siret: agency.legal.siret,
                    tvaNumber: agency.legal.tvaNumber,
                    capital: agency.legal.capital,
                    rcs: agency.legal.rcs,
                  } : undefined,
                } : mockAgency}
                colorOverrides={effectiveColorMap}
              />
            </div>
          ) : selectedTemplate === 'contacts' ? (
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <ContactsUtilesTemplate
                data={{
                  buildingNom: watchedValues.buildingNom || '',
                  buildingAdresse: watchedValues.buildingAdresse || '',
                  buildingCodePostal: watchedValues.buildingCodePostal || '',
                  buildingVille: watchedValues.buildingVille || '',
                  syndicNom: agency?.name || 'Beamô',
                  syndicAdresse: agency ? [agency.address, agency.zipCode, agency.city].filter(Boolean).join(' ') : '',
                  syndicTelephone: agency?.phone || '',
                  syndicEmail: agency?.email || '',
                  gestionnaireNom: watchedValues.gestionnaireNom || '',
                  gestionnaireTelephone: watchedValues.gestionnaireTelephone || '',
                  gestionnaireEmail: watchedValues.gestionnaireEmail || '',
                  enedisPhone: watchedValues.enedisPhone || '',
                  eauPrivative: watchedValues.eauPrivative || false,
                  eauFournisseur: watchedValues.eauFournisseur || '',
                  eauPhone: watchedValues.eauPhone || '',
                  mairieName: watchedValues.mairieName || '',
                  mairiePhone: watchedValues.mairiePhone || '',
                  dechetterieName: watchedValues.dechetterieName || '',
                  dechetteriePhone: watchedValues.dechetteriePhone || '',
                  dechetterieAdresse: watchedValues.dechetterieAdresse || '',
                  dechetterieHoraires: watchedValues.dechetterieHoraires || '',
                  contracts: watchedValues.contracts || [],
                  conseillers: watchedValues.conseillers || [],
                  showUrgences: watchedValues.showUrgences,
                  showEnergie: watchedValues.showEnergie,
                  showContracts: watchedValues.showContracts,
                  showConseillers: watchedValues.showConseillers,
                  urgences: watchedValues.urgences || [],
                  customBlocks: (watchedValues.customBlocks || []).map(b => ({
                    id: b.id,
                    title: b.title,
                    icon: b.icon,
                    lines: b.lines.split('\n').filter(l => l.trim() !== ''),
                    show: b.show,
                  })),
                  agency: agency ? {
                    nom: agency.name,
                    adresse: agency.address || '',
                    codePostal: agency.zipCode || '',
                    ville: agency.city || '',
                    telephone: agency.phone || '',
                    email: agency.email || '',
                    legal: agency.legal ? {
                      siret: agency.legal.siret,
                      tvaNumber: agency.legal.tvaNumber,
                      capital: agency.legal.capital,
                      rcs: agency.legal.rcs,
                    } : undefined,
                  } : mockAgency,
                }}
              />
            </div>
          ) : (
            <div
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <ReglementInterieurTemplate
                data={{
                  buildingNom: watchedValues.buildingNom || '',
                  buildingAdresse: watchedValues.buildingAdresse || '',
                  buildingCodePostal: watchedValues.buildingCodePostal || '',
                  buildingVille: watchedValues.buildingVille || '',
                  features: watchedValues.features || {},
                  showPreambule: watchedValues.showPreambule,
                  preambuleContent: watchedValues.preambuleContent,
                  showSecurite: watchedValues.showSecurite,
                  securiteContent: watchedValues.securiteContent,
                  articleContents: articleDefaults,
                  agency: agency ? {
                    nom: agency.name,
                    adresse: agency.address || '',
                    codePostal: agency.zipCode || '',
                    ville: agency.city || '',
                    telephone: agency.phone || '',
                    email: agency.email || '',
                    legal: agency.legal ? {
                      siret: agency.legal.siret,
                      tvaNumber: agency.legal.tvaNumber,
                      capital: agency.legal.capital,
                      rcs: agency.legal.rcs,
                    } : undefined,
                  } : mockAgency,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
