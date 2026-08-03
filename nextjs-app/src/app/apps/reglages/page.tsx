'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  RotateCcw, Settings, FileText, Printer, Plus, Trash2, MapPin, Eye, EyeOff,
  Info, Phone, Mail, Building2, User, Users, Wrench,
  Shield, Key, Clock, Car, Bike, Leaf, Zap, Droplets, Flame, Package, Star,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ARTICLES } from '@/components/documents/templates/ReglementInterieurTemplate'
import { DOCUMENT_TYPE_COLORS } from '@/schemas/document'
import type { CommuneContacts, CommuneContactsMap } from '@/schemas/document'
import { normalizeCityKey } from '@/lib/contacts-utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const REGLEMENT_STORAGE_KEY = 'beamo_reglages_reglement'
const AFFICHE_STORAGE_KEY = 'beamo_reglages_affiche'
const COMMUNES_STORAGE_KEY = 'beamo_reglages_communes'
const CUSTOM_BLOCKS_STORAGE_KEY = 'beamo_reglages_custom_blocks'
const COMMUNES_API = '/api/settings/communes'

type ArticleKey = keyof typeof ARTICLES

interface CustomCategory {
  key: string
  label: string
  bg: string
}

interface CustomBlockDefault {
  id: string
  title: string
  icon: string
  lines: string // lignes séparées par \n (textarea)
  show: boolean
}

const CUSTOM_ICON_MAP: Record<string, LucideIcon> = {
  Info, Phone, Mail, MapPin, Building2, User, Users, Wrench,
  Shield, Key, Clock, Car, Bike, Leaf, Zap, Droplets, Flame, Package, Star,
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

interface AfficheSettings {
  colors: Record<string, string>
  customCategories: CustomCategory[]
}

const DEFAULT_AFFICHE_SETTINGS: AfficheSettings = {
  colors: {},
  customCategories: [],
}

function AddCommuneInput({
  estaleCondos,
  communeContacts,
  onAdd,
}: {
  estaleCondos: { id: string; name: string; city?: string; zipCode?: string }[]
  communeContacts: CommuneContactsMap
  onAdd: (label: string, codePostal?: string) => void
}) {
  const [query, setQuery] = useState('')

  const suggestions = Array.from(
    new Map(
      estaleCondos
        .filter(c => c.city && !communeContacts[normalizeCityKey(c.city)])
        .map(c => [normalizeCityKey(c.city!), c])
    ).values()
  )

  const handleAdd = () => {
    if (!query.trim()) return
    const match = suggestions.find(c => c.city?.toLowerCase() === query.trim().toLowerCase())
    onAdd(query.trim(), match?.zipCode)
    setQuery('')
  }

  return (
    <div className="flex items-center gap-3 p-3 border-2 border-dashed rounded-lg">
      <MapPin className="h-4 w-4 text-app-fg-faint shrink-0" />
      <div className="flex-1">
        <datalist id="reglages-condos-datalist">
          {suggestions.map(c => (
            <option key={c.id} value={c.city!} />
          ))}
        </datalist>
        <Input
          list="reglages-condos-datalist"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Chercher une ville du portefeuille ou saisir manuellement..."
          className="h-8 text-sm"
        />
      </div>
      <Button variant="outline" size="sm" onClick={handleAdd} disabled={!query.trim()} className="text-xs shrink-0">
        <Plus className="h-3 w-3 mr-1.5" />
        Ajouter
      </Button>
    </div>
  )
}

export default function ReglagesPage() {
  // --- Règlement Intérieur state ---
  const [articleOverrides, setArticleOverrides] = useState<Record<string, string>>({})

  // --- Affiche Travaux state ---
  const [afficheSettings, setAfficheSettings] = useState<AfficheSettings>(DEFAULT_AFFICHE_SETTINGS)
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#6366F1')

  // --- Blocs personnalisés par défaut ---
  const [customBlockDefaults, setCustomBlockDefaults] = useState<CustomBlockDefault[]>([])

  // --- Contacts par commune state ---
  const [communeContacts, setCommuneContacts] = useState<CommuneContactsMap>({})

  // --- Estale suppliers for pickers ---
  const [estaleSuppliers, setEstaleSuppliers] = useState<{ id: string; name: string; phone?: string; address?: string; specialty?: string; tags?: string[] }[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)

  // --- Estale condos for commune creation ---
  const [estaleCondos, setEstaleCondos] = useState<{ id: string; name: string; city?: string; zipCode?: string }[]>([])
  const [loadingCondos, setLoadingCondos] = useState(false)

  const [loaded, setLoaded] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const afficheDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const communeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const customBlocksDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedReglement = localStorage.getItem(REGLEMENT_STORAGE_KEY)
      if (storedReglement) {
        setArticleOverrides(JSON.parse(storedReglement))
      }
    } catch (e) {
      console.error('Erreur chargement réglages règlement:', e)
    }
    try {
      const storedAffiche = localStorage.getItem(AFFICHE_STORAGE_KEY)
      if (storedAffiche) {
        setAfficheSettings(JSON.parse(storedAffiche))
      }
    } catch (e) {
      console.error('Erreur chargement réglages affiche:', e)
    }
    try {
      const storedBlocks = localStorage.getItem(CUSTOM_BLOCKS_STORAGE_KEY)
      if (storedBlocks) {
        setCustomBlockDefaults(JSON.parse(storedBlocks))
      }
    } catch (e) {
      console.error('Erreur chargement blocs personnalisés:', e)
    }
    // Charger les communes depuis le serveur (persistant), avec fallback localStorage
    fetch(COMMUNES_API)
      .then(res => res.json())
      .then(data => {
        if (data && Object.keys(data).length > 0) {
          setCommuneContacts(data)
          localStorage.setItem(COMMUNES_STORAGE_KEY, JSON.stringify(data))
        } else {
          // Fallback : localStorage si le serveur est vide
          try {
            const storedCommunes = localStorage.getItem(COMMUNES_STORAGE_KEY)
            if (storedCommunes) {
              const parsed = JSON.parse(storedCommunes)
              setCommuneContacts(parsed)
              // Migrer vers le serveur
              fetch(COMMUNES_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: storedCommunes })
                .catch(() => {})
            }
          } catch (e) {
            console.error('Erreur chargement réglages communes (localStorage):', e)
          }
        }
      })
      .catch(() => {
        // Si l'API est indisponible, utiliser localStorage
        try {
          const storedCommunes = localStorage.getItem(COMMUNES_STORAGE_KEY)
          if (storedCommunes) {
            setCommuneContacts(JSON.parse(storedCommunes))
          }
        } catch (e) {
          console.error('Erreur chargement réglages communes:', e)
        }
      })
      .finally(() => setLoaded(true))

    // Fetch Estale suppliers
    setLoadingSuppliers(true)
    fetch('/api/estale/suppliers')
      .then(res => res.json())
      .then(data => {
        if (data.suppliers && data.suppliers.length > 0) {
          setEstaleSuppliers(data.suppliers.map((s: any) => ({
            id: s.id,
            name: s.name,
            phone: s.phone || '',
            address: s.address || '',
            specialty: s.specialty || '',
            tags: s.tags || [],
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSuppliers(false))

    // Fetch Estale condos (for commune creation from condo cities)
    setLoadingCondos(true)
    fetch('/api/estale/condos')
      .then(res => res.json())
      .then(data => {
        if (data.condos && data.condos.length > 0) {
          setEstaleCondos(data.condos.map((c: any) => ({
            id: c.id,
            name: c.name,
            city: c.city || '',
            zipCode: c.zipCode || '',
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingCondos(false))
  }, [])

  // Auto-save Règlement to localStorage with debounce
  const saveReglementToStorage = useCallback((overrides: Record<string, string>) => {
    const cleaned: Record<string, string> = {}
    for (const [key, value] of Object.entries(overrides)) {
      const article = ARTICLES[key as ArticleKey]
      if (article && value.trim() !== '' && value !== article.content) {
        cleaned[key] = value
      }
    }
    localStorage.setItem(REGLEMENT_STORAGE_KEY, JSON.stringify(cleaned))
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      saveReglementToStorage(articleOverrides)
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [articleOverrides, loaded, saveReglementToStorage])

  // Auto-save Affiche to localStorage with debounce
  const saveAfficheToStorage = useCallback((settings: AfficheSettings) => {
    localStorage.setItem(AFFICHE_STORAGE_KEY, JSON.stringify(settings))
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (afficheDebounceRef.current) clearTimeout(afficheDebounceRef.current)
    afficheDebounceRef.current = setTimeout(() => {
      saveAfficheToStorage(afficheSettings)
    }, 500)
    return () => {
      if (afficheDebounceRef.current) clearTimeout(afficheDebounceRef.current)
    }
  }, [afficheSettings, loaded, saveAfficheToStorage])

  // Auto-save Custom Blocks to localStorage with debounce
  const saveCustomBlocksToStorage = useCallback((blocks: CustomBlockDefault[]) => {
    localStorage.setItem(CUSTOM_BLOCKS_STORAGE_KEY, JSON.stringify(blocks))
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (customBlocksDebounceRef.current) clearTimeout(customBlocksDebounceRef.current)
    customBlocksDebounceRef.current = setTimeout(() => {
      saveCustomBlocksToStorage(customBlockDefaults)
    }, 500)
    return () => {
      if (customBlocksDebounceRef.current) clearTimeout(customBlocksDebounceRef.current)
    }
  }, [customBlockDefaults, loaded, saveCustomBlocksToStorage])

  // Auto-save Communes to server + localStorage with debounce
  const saveCommunesToStorage = useCallback((contacts: CommuneContactsMap) => {
    const json = JSON.stringify(contacts)
    localStorage.setItem(COMMUNES_STORAGE_KEY, json)
    fetch(COMMUNES_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json,
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!loaded) return
    if (communeDebounceRef.current) clearTimeout(communeDebounceRef.current)
    communeDebounceRef.current = setTimeout(() => {
      saveCommunesToStorage(communeContacts)
    }, 500)
    return () => {
      if (communeDebounceRef.current) clearTimeout(communeDebounceRef.current)
    }
  }, [communeContacts, loaded, saveCommunesToStorage])

  // Auto-sync commune contacts when Estale suppliers are loaded
  useEffect(() => {
    if (!loaded || estaleSuppliers.length === 0) return

    setCommuneContacts(prev => {
      let changed = false
      const updated = { ...prev }

      for (const [key, commune] of Object.entries(updated)) {
        const fields: { idField: keyof CommuneContacts; nameField: keyof CommuneContacts; phoneField: keyof CommuneContacts }[] = [
          { idField: 'mairieSupplierEstaleId', nameField: 'mairieName', phoneField: 'mairiePhone' },
          { idField: 'dechetterieSupplierEstaleId', nameField: 'dechetterieName', phoneField: 'dechetteriePhone' },
          { idField: 'eauSupplierEstaleId', nameField: 'eauFournisseur', phoneField: 'eauPhone' },
        ]

        for (const { idField, nameField, phoneField } of fields) {
          const estaleId = commune[idField] as string | undefined
          if (!estaleId) continue

          const supplier = estaleSuppliers.find(s => s.id === estaleId)
          if (!supplier) continue

          const currentName = commune[nameField] as string | undefined
          const currentPhone = commune[phoneField] as string | undefined
          if (currentName !== supplier.name || currentPhone !== (supplier.phone || '')) {
            updated[key] = {
              ...updated[key],
              [nameField]: supplier.name,
              [phoneField]: supplier.phone || '',
            }
            changed = true
          }
        }
      }

      return changed ? updated : prev
    })
  }, [loaded, estaleSuppliers])

  // --- Règlement handlers ---
  const handleRestore = (key: string) => {
    const updated = { ...articleOverrides }
    delete updated[key]
    setArticleOverrides(updated)
  }

  const handleContentChange = (key: string, value: string) => {
    setArticleOverrides(prev => ({ ...prev, [key]: value }))
  }

  const isModified = (key: string) => {
    const override = articleOverrides[key]
    if (!override) return false
    const article = ARTICLES[key as ArticleKey]
    return article && override !== article.content
  }

  const getDisplayContent = (key: string) => {
    return articleOverrides[key] ?? ARTICLES[key as ArticleKey]?.content ?? ''
  }

  // --- Affiche handlers ---
  const handleColorChange = (typeKey: string, color: string) => {
    setAfficheSettings(prev => ({
      ...prev,
      colors: { ...prev.colors, [typeKey]: color },
    }))
  }

  const handleRestoreColor = (typeKey: string) => {
    setAfficheSettings(prev => {
      const { [typeKey]: _, ...rest } = prev.colors
      return { ...prev, colors: rest }
    })
  }

  const isColorModified = (typeKey: string) => {
    return typeKey in afficheSettings.colors
  }

  const getEffectiveColor = (typeKey: string) => {
    return afficheSettings.colors[typeKey] ?? DOCUMENT_TYPE_COLORS[typeKey as keyof typeof DOCUMENT_TYPE_COLORS]?.bg ?? '#FFC300'
  }

  const handleAddCategory = () => {
    const label = newCategoryLabel.trim()
    if (!label) return
    const key = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now()
    setAfficheSettings(prev => ({
      ...prev,
      customCategories: [...prev.customCategories, { key, label, bg: newCategoryColor }],
    }))
    setNewCategoryLabel('')
    setNewCategoryColor('#6366F1')
  }

  const handleDeleteCategory = (key: string) => {
    setAfficheSettings(prev => ({
      ...prev,
      customCategories: prev.customCategories.filter(c => c.key !== key),
    }))
  }

  const handleCustomCategoryColorChange = (key: string, color: string) => {
    setAfficheSettings(prev => ({
      ...prev,
      customCategories: prev.customCategories.map(c =>
        c.key === key ? { ...c, bg: color } : c
      ),
    }))
  }

  const handleCustomCategoryLabelChange = (key: string, label: string) => {
    setAfficheSettings(prev => ({
      ...prev,
      customCategories: prev.customCategories.map(c =>
        c.key === key ? { ...c, label } : c
      ),
    }))
  }

  // --- Commune handlers ---
const handleDeleteCommune = (key: string) => {
    setCommuneContacts(prev => {
      const { [key]: _, ...rest } = prev
      return rest
    })
  }

  const handleCommuneFieldChange = (
    key: string,
    field: keyof Omit<CommuneContacts, 'conseillers' | 'label'>,
    value: string
  ) => {
    // Clear linked Estale ID when manually editing a supplier-bound field
    const clearIdMap: Record<string, string> = {
      mairieName: 'mairieSupplierEstaleId',
      mairiePhone: 'mairieSupplierEstaleId',
      dechetterieName: 'dechetterieSupplierEstaleId',
      dechetteriePhone: 'dechetterieSupplierEstaleId',
      eauFournisseur: 'eauSupplierEstaleId',
      eauPhone: 'eauSupplierEstaleId',
    }
    const idField = clearIdMap[field]
    setCommuneContacts(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
        ...(idField ? { [idField]: undefined } : {}),
      },
    }))
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-app-fg-muted">Chargement...</p>
      </div>
    )
  }

  const articleEntries = Object.entries(ARTICLES) as [ArticleKey, typeof ARTICLES[ArticleKey]][]
  const defaultTypeEntries = Object.entries(DOCUMENT_TYPE_COLORS) as [string, { bg: string; label: string }][]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-app-fg" />
        <h1 className="text-2xl font-bold text-app-fg">Réglages</h1>
      </div>

      {/* Two collapsible sections */}
      <Accordion type="multiple" defaultValue={[]} className="space-y-4">

        {/* ========== SECTION 1: RÈGLEMENT INTÉRIEUR ========== */}
        <AccordionItem value="reglement" className="border rounded-xl">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-app-fg-muted" />
              <span className="text-lg font-semibold">Contenu par défaut des articles</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <p className="text-sm text-app-fg-muted mb-5">
              Personnalisez le contenu par défaut de chaque article du Règlement Intérieur.
              Le markdown est supporté (<strong>**gras**</strong>, <em>*italique*</em>, listes...).
            </p>

            <div className="space-y-5">
              {articleEntries.map(([key, article]) => {
                const Icon = article.icon
                const modified = isModified(key)
                return (
                  <Card key={key} className="border-app-border">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-app-fg-muted shrink-0" />
                        <CardTitle className="text-sm font-semibold">{article.title}</CardTitle>
                        {modified && (
                          <Badge className="bg-[#FFC300] text-app-accent-foreground hover:bg-[#FFC300] text-[10px] px-1.5 py-0">
                            Modifié
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <Textarea
                        value={getDisplayContent(key)}
                        onChange={(e) => handleContentChange(key, e.target.value)}
                        className="min-h-[100px] text-sm font-mono resize-y"
                      />
                      {modified && (
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(key)}
                            className="text-xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1.5" />
                            Restaurer par défaut
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ========== SECTION 2: AFFICHE TRAVAUX ========== */}
        <AccordionItem value="affiche" className="border rounded-xl">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5 text-app-fg-muted" />
              <span className="text-lg font-semibold">Couleurs des affiches travaux</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <p className="text-sm text-app-fg-muted mb-5">
              Modifiez les couleurs associées à chaque type d'affiche ou ajoutez vos propres catégories.
            </p>

            {/* Existing types */}
            <div className="space-y-3 mb-6">
              <Label className="text-xs font-semibold text-app-fg-muted uppercase tracking-wide">
                Types existants
              </Label>
              {defaultTypeEntries.map(([typeKey, { bg: defaultBg, label }]) => {
                const modified = isColorModified(typeKey)
                const effectiveColor = getEffectiveColor(typeKey)
                return (
                  <div key={typeKey} className="flex items-center gap-3 p-3 border rounded-lg bg-app-surface-2">
                    <input
                      type="color"
                      value={effectiveColor}
                      onChange={(e) => handleColorChange(typeKey, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-app-border p-0.5"
                    />
                    <span className="text-sm font-medium flex-1">{label}</span>
                    {modified && (
                      <>
                        <Badge className="bg-[#FFC300] text-app-accent-foreground hover:bg-[#FFC300] text-[10px] px-1.5 py-0">
                          Modifié
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRestoreColor(typeKey)}
                          title="Restaurer la couleur par défaut"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Custom categories */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-app-fg-muted uppercase tracking-wide">
                Catégories personnalisées
              </Label>

              {afficheSettings.customCategories.length > 0 && (
                <div className="space-y-3">
                  {afficheSettings.customCategories.map((cat) => (
                    <div key={cat.key} className="flex items-center gap-3 p-3 border rounded-lg bg-app-surface-2">
                      <input
                        type="color"
                        value={cat.bg}
                        onChange={(e) => handleCustomCategoryColorChange(cat.key, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border border-app-border p-0.5"
                      />
                      <Input
                        value={cat.label}
                        onChange={(e) => handleCustomCategoryLabelChange(cat.key, e.target.value)}
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteCategory(cat.key)}
                        title="Supprimer cette catégorie"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new category */}
              <div className="flex items-center gap-3 p-3 border-2 border-dashed rounded-lg">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-app-border p-0.5"
                />
                <Input
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  placeholder="Nom de la catégorie"
                  className="h-8 text-sm flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={!newCategoryLabel.trim()}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1.5" />
                  Ajouter
                </Button>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ========== SECTION 3: CONTACTS PAR COMMUNE ========== */}
        <AccordionItem value="communes" className="border rounded-xl">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-app-fg-muted" />
              <span className="text-lg font-semibold">Contacts par commune</span>
              {Object.keys(communeContacts).length > 0 && (
                <span className="text-xs bg-[#FFC300] text-app-accent-foreground px-2 py-0.5 rounded-full">
                  {Object.keys(communeContacts).length}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <p className="text-sm text-app-fg-muted mb-5">
              Configurez les contacts utiles pour chaque commune (mairie, déchetterie, eau). Ces données seront utilisées automatiquement dans l'affiche &quot;Contacts Utiles&quot;. Recherchez par nom ou tag pour pré-remplir depuis Estale.
            </p>

            {/* Datalist natif — suggestions fournisseurs Estale */}
            <datalist id="reglages-suppliers-datalist">
              {estaleSuppliers.map(s => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>

            {/* Existing communes */}
            <div className="space-y-4 mb-6">
              {Object.entries(communeContacts).map(([key, commune]) => (
                <Card key={key} className="border-app-border">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-app-fg-muted" />
                          {commune.label}
                          {commune.codePostal && (
                            <span className="text-xs font-normal text-app-fg-faint">({commune.codePostal})</span>
                          )}
                        </CardTitle>
                        {/* Copropriétés de cette ville — liaison automatique */}
                        {(() => {
                          const matched = estaleCondos.filter(c =>
                            normalizeCityKey(c.city || '') === key
                          )
                          if (!matched.length) return null
                          return (
                            <p className="text-[10px] text-app-fg-faint mt-0.5">
                              Lié à : {matched.map(c => c.name).join(', ')}
                            </p>
                          )
                        })()}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteCommune(key)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    {/* Mairie */}
                    <div>
                      <Label className="text-xs font-semibold text-app-fg-muted">Mairie</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Input
                          list="reglages-suppliers-datalist"
                          value={commune.mairieName || ''}
                          placeholder="Nom (ex: Mairie de Vernon)"
                          className="h-8 text-sm"
                          onChange={e => {
                            const val = e.target.value
                            const match = estaleSuppliers.find(s => s.name === val)
                            setCommuneContacts(prev => ({ ...prev, [key]: { ...prev[key], mairieName: val, mairiePhone: match?.phone || prev[key].mairiePhone || '', mairieSupplierEstaleId: match?.id || prev[key].mairieSupplierEstaleId } }))
                          }}
                        />
                        <Input
                          value={commune.mairiePhone || ''}
                          onChange={(e) => handleCommuneFieldChange(key, 'mairiePhone', e.target.value)}
                          placeholder="Téléphone"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Déchetterie */}
                    <div>
                      <Label className="text-xs font-semibold text-app-fg-muted">Déchetterie</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Input
                          list="reglages-suppliers-datalist"
                          value={commune.dechetterieName || ''}
                          placeholder="Nom"
                          className="h-8 text-sm"
                          onChange={e => {
                            const val = e.target.value
                            const match = estaleSuppliers.find(s => s.name === val)
                            setCommuneContacts(prev => ({ ...prev, [key]: { ...prev[key], dechetterieName: val, dechetteriePhone: match?.phone || prev[key].dechetteriePhone || '', dechetterieAdresse: match?.address || prev[key].dechetterieAdresse || '', dechetterieSupplierEstaleId: match?.id || prev[key].dechetterieSupplierEstaleId } }))
                          }}
                        />
                        <Input
                          value={commune.dechetteriePhone || ''}
                          onChange={(e) => handleCommuneFieldChange(key, 'dechetteriePhone', e.target.value)}
                          placeholder="Téléphone"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={commune.dechetterieAdresse || ''}
                          onChange={(e) => handleCommuneFieldChange(key, 'dechetterieAdresse', e.target.value)}
                          placeholder="Adresse"
                          className="h-8 text-sm"
                        />
                        <Input
                          value={commune.dechetterieHoraires || ''}
                          onChange={(e) => handleCommuneFieldChange(key, 'dechetterieHoraires', e.target.value)}
                          placeholder="Horaires (ex: Lun-Sam 9h-17h)"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Eau */}
                    <div>
                      <Label className="text-xs font-semibold text-app-fg-muted">Eau</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Input
                          list="reglages-suppliers-datalist"
                          value={commune.eauFournisseur || ''}
                          placeholder="Fournisseur (ex: Veolia)"
                          className="h-8 text-sm"
                          onChange={e => {
                            const val = e.target.value
                            const match = estaleSuppliers.find(s => s.name === val)
                            setCommuneContacts(prev => ({ ...prev, [key]: { ...prev[key], eauFournisseur: val, eauPhone: match?.phone || prev[key].eauPhone || '', eauSupplierEstaleId: match?.id || prev[key].eauSupplierEstaleId } }))
                          }}
                        />
                        <Input
                          value={commune.eauPhone || ''}
                          onChange={(e) => handleCommuneFieldChange(key, 'eauPhone', e.target.value)}
                          placeholder="Téléphone"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    {/* Contacts supplémentaires */}
                    {(commune.extras || []).map((extra, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2 mb-1">
                          <Input
                            value={extra.label}
                            onChange={e => {
                              const extras = [...(commune.extras || [])]
                              extras[i] = { ...extras[i], label: e.target.value }
                              setCommuneContacts(prev => ({ ...prev, [key]: { ...prev[key], extras } }))
                            }}
                            placeholder="Type de contact (ex: Gaz, Pompiers...)"
                            className="h-7 text-xs font-semibold flex-1"
                          />
                          <button
                            type="button"
                            className="text-app-fg-faint hover:text-red-500 text-xs"
                            onClick={() => {
                              const extras = (commune.extras || []).filter((_, j) => j !== i)
                              setCommuneContacts(prev => ({ ...prev, [key]: { ...prev[key], extras } }))
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            list="reglages-suppliers-datalist"
                            value={extra.name || ''}
                            placeholder="Nom"
                            className="h-8 text-sm"
                            onChange={e => {
                              const val = e.target.value
                              const match = estaleSuppliers.find(s => s.name === val)
                              const extras = [...(commune.extras || [])]
                              extras[i] = { ...extras[i], name: val, phone: match?.phone || extras[i].phone || '' }
                              setCommuneContacts(prev => ({ ...prev, [key]: { ...prev[key], extras } }))
                            }}
                          />
                          <Input
                            value={extra.phone || ''}
                            onChange={e => {
                              const extras = [...(commune.extras || [])]
                              extras[i] = { ...extras[i], phone: e.target.value }
                              setCommuneContacts(prev => ({ ...prev, [key]: { ...prev[key], extras } }))
                            }}
                            placeholder="Téléphone"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs w-full border-dashed"
                      onClick={() => {
                        const extras = [...(commune.extras || []), { label: '', name: '', phone: '' }]
                        setCommuneContacts(prev => ({ ...prev, [key]: { ...prev[key], extras } }))
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1.5" />
                      Ajouter un contact
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add new commune */}
            <AddCommuneInput
              estaleCondos={estaleCondos}
              communeContacts={communeContacts}
              onAdd={(label, codePostal) => {
                const key = normalizeCityKey(label)
                if (communeContacts[key]) return
                setCommuneContacts(prev => ({
                  ...prev,
                  [key]: { label, codePostal: codePostal || '', conseillers: [] } as CommuneContacts,
                }))
              }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* ========== SECTION 4: BLOCS PERSONNALISÉS PAR DÉFAUT ========== */}
        <AccordionItem value="custom-blocks" className="border rounded-xl">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <Plus className="h-5 w-5 text-app-fg-muted" />
              <span className="text-lg font-semibold">Blocs personnalisés par défaut</span>
              {customBlockDefaults.length > 0 && (
                <span className="text-xs bg-[#FFC300] text-app-accent-foreground px-2 py-0.5 rounded-full">
                  {customBlockDefaults.length}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <p className="text-sm text-app-fg-muted mb-5">
              Ces blocs seront pré-chargés dans chaque nouveau document &quot;Contacts Utiles&quot;. Vous pouvez les masquer ou modifier leur contenu pour chaque document.
            </p>

            <div className="space-y-4">
              {customBlockDefaults.map((block, idx) => (
                <Card key={block.id} className="border-app-border">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-app-fg-faint hover:text-app-fg shrink-0"
                        title={block.show ? 'Affiché par défaut' : 'Masqué par défaut'}
                        onClick={() => {
                          const updated = [...customBlockDefaults]
                          updated[idx] = { ...updated[idx], show: !updated[idx].show }
                          setCustomBlockDefaults(updated)
                        }}
                      >
                        {block.show
                          ? <Eye className="h-4 w-4" />
                          : <EyeOff className="h-4 w-4 text-app-fg-faint" />}
                      </button>
                      <Select
                        value={block.icon}
                        onValueChange={(v) => {
                          const updated = [...customBlockDefaults]
                          updated[idx] = { ...updated[idx], icon: v }
                          setCustomBlockDefaults(updated)
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs w-44 shrink-0">
                          <SelectValue placeholder="Icône" />
                        </SelectTrigger>
                        <SelectContent>
                          {CUSTOM_BLOCK_ICONS.map(ic => {
                            const Icon = CUSTOM_ICON_MAP[ic.value] || Info
                            return (
                              <SelectItem key={ic.value} value={ic.value} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5 shrink-0 text-app-fg-muted" />
                                  {ic.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-8 text-sm flex-1"
                        placeholder="Titre du bloc"
                        value={block.title}
                        onChange={(e) => {
                          const updated = [...customBlockDefaults]
                          updated[idx] = { ...updated[idx], title: e.target.value }
                          setCustomBlockDefaults(updated)
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 shrink-0"
                        onClick={() => setCustomBlockDefaults(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      className="text-sm min-h-[80px] resize-y font-mono"
                      placeholder={"Corps du texte..."}
                      value={block.lines}
                      onChange={(e) => {
                        const updated = [...customBlockDefaults]
                        updated[idx] = { ...updated[idx], lines: e.target.value }
                        setCustomBlockDefaults(updated)
                      }}
                    />
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={() => setCustomBlockDefaults(prev => [
                  ...prev,
                  { id: crypto.randomUUID(), title: '', icon: 'Info', lines: '', show: true },
                ])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un bloc
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  )
}
