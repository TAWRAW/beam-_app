import { SimulateurState, ExportData, createDefaultCle, CleDeCharges, Lot, DEFAULT_CLE_ID } from './types'
import { EXPORT_VERSION } from './constants'
import { initialState } from './reducer'

// ============================================================================
// CSV Template & Import
// ============================================================================

/**
 * Clés de charges par défaut pour le modèle CSV (10 colonnes avec exemples)
 */
const DEFAULT_TEMPLATE_CLES = [
  { nom: 'Charges générales' },
  { nom: 'ex: Ascenseur' },
  { nom: 'ex: Chauffage' },
  { nom: 'ex: Escalier' },
  { nom: 'ex: Bâtiment A' },
  { nom: 'ex: Bâtiment B' },
  { nom: 'ex: Sous-sol' },
  { nom: 'ex: Parking' },
  { nom: 'ex: Espaces verts' },
  { nom: 'ex: Eau froide' },
]

/**
 * Génère un modèle CSV téléchargeable avec 50 lignes pré-numérotées
 * Seuls les numéros de lots sont pré-remplis, le reste est à compléter par l'utilisateur
 * @param clesDeCharges - Les clés de charges existantes (optionnel)
 */
export function generateCSVTemplate(clesDeCharges?: CleDeCharges[]): string {
  // Utiliser les clés existantes ou les clés par défaut du modèle
  const cles = clesDeCharges && clesDeCharges.length > 1
    ? clesDeCharges
    : DEFAULT_TEMPLATE_CLES

  // En-tête avec les colonnes pour chaque clé
  const headers = ['N° Lot', 'Nom (facultatif)', ...cles.map((c) => `Tantièmes - ${c.nom}`)]

  // Générer 50 lignes avec uniquement les numéros de lot pré-remplis
  const exampleRows: string[][] = []
  for (let i = 0; i < 50; i++) {
    const lotNumber = String(i + 1)
    // Nom et tantièmes vides - à remplir par l'utilisateur
    exampleRows.push([lotNumber, '', ...cles.map(() => '')])
  }

  // Construire le CSV
  const rows = [headers, ...exampleRows]
  return rows.map((row) => row.map(escapeCSVField).join(';')).join('\n')
}

/**
 * Échappe un champ CSV (gestion des guillemets et points-virgules)
 */
function escapeCSVField(field: string): string {
  if (field.includes(';') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Télécharge le modèle CSV
 */
export function downloadCSVTemplate(clesDeCharges?: CleDeCharges[]): void {
  const csv = generateCSVTemplate(clesDeCharges)
  // BOM pour Excel
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'modele-lots-copropriete.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Parse un fichier CSV et retourne les données
 */
export function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim())
  const rows: string[][] = []

  for (const line of lines) {
    const row: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          current += '"'
          i++ // Skip next quote
        } else if (char === '"') {
          inQuotes = false
        } else {
          current += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === ';' || char === ',') {
          row.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
    }
    row.push(current.trim())
    rows.push(row)
  }

  return rows
}

/**
 * Importe les données depuis un fichier CSV
 */
export function importFromCSV(content: string): ExportData | null {
  try {
    const rows = parseCSV(content)
    if (rows.length < 2) return null // Au moins header + 1 ligne

    const headers = rows[0]
    if (headers.length < 2) return null // Au moins N° Lot + 1 colonne tantièmes

    // Détecter les colonnes de tantièmes
    const tantièmesColumns: { index: number; nom: string }[] = []
    for (let i = 1; i < headers.length; i++) {
      const header = headers[i].toLowerCase()
      if (header.includes('tantième') || header.includes('tantiemes') || header.includes('tantièmes')) {
        // Extraire le nom de la clé si présent
        const match = headers[i].match(/tantièmes?\s*-?\s*(.+)?/i)
        const nom = match?.[1]?.trim() || 'Charges générales'
        tantièmesColumns.push({ index: i, nom })
      }
    }

    // Si aucune colonne tantièmes détectée, prendre la dernière colonne comme tantièmes
    if (tantièmesColumns.length === 0) {
      tantièmesColumns.push({ index: headers.length - 1, nom: 'Charges générales' })
    }

    // Créer les clés de charges
    const clesDeCharges: CleDeCharges[] = tantièmesColumns.map((col, index) => ({
      id: index === 0 ? DEFAULT_CLE_ID : `cle-${Date.now()}-${index}`,
      nom: col.nom,
      isDefault: index === 0,
    }))

    // Parser les lots
    const lots: Lot[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[0] || row[0].trim() === '') continue // Ignorer les lignes sans numéro de lot

      const numero = row[0].trim()
      // Colonne Nom : index 1 si elle existe et n'est pas une colonne tantièmes
      const nomIndex = headers.findIndex(
        (h) => h.toLowerCase().includes('nom') && !h.toLowerCase().includes('tantième')
      )
      const nom = nomIndex > 0 && row[nomIndex] ? row[nomIndex].trim() : undefined

      // Récupérer les tantièmes pour chaque clé
      const tantièmesParCle: Record<string, number> = {}
      let hasTantiemes = false
      tantièmesColumns.forEach((col, colIndex) => {
        const value = row[col.index]
        const tantiemes = parseInt(value?.replace(/\s/g, '') || '0', 10)
        const finalValue = isNaN(tantiemes) ? 0 : tantiemes
        tantièmesParCle[clesDeCharges[colIndex].id] = finalValue
        if (finalValue > 0) {
          hasTantiemes = true
        }
      })

      // Ignorer les lignes sans tantièmes renseignés
      if (!hasTantiemes) continue

      lots.push({
        id: `lot-${Date.now()}-${i}`,
        numero,
        nom: nom || undefined,
        tantièmesParCle,
      })
    }

    if (lots.length === 0) return null

    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      copropriete: {
        nom: 'Ma copropriété',
        clesDeCharges,
        lots,
      },
      presences: {},
      representations: {},
      externalRepresentatives: {},
    }
  } catch (error) {
    console.error('Erreur lors du parsing CSV:', error)
    return null
  }
}

// ============================================================================
// LocalStorage
// ============================================================================

const STORAGE_KEY = 'beamo_simulateur_vote'

/**
 * Vérifie si localStorage est disponible
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const testKey = '__test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * Sauvegarde l'état dans localStorage
 */
export function saveState(state: SimulateurState): boolean {
  if (!isLocalStorageAvailable()) return false

  try {
    const data: ExportData = {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      copropriete: {
        nom: 'Ma copropriété',
        clesDeCharges: state.clesDeCharges,
        lots: state.lots,
      },
      presences: state.presences,
      representations: state.representations,
      externalRepresentatives: state.externalRepresentatives,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    return false
  }
}

/**
 * Charge l'état depuis localStorage
 */
export function loadState(): Partial<SimulateurState> | null {
  if (!isLocalStorageAvailable()) return null

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored) as ExportData

    // Vérifier la version
    if (!data.version) {
      console.warn('Données stockées sans version, ignorées')
      return null
    }

    return {
      clesDeCharges: data.copropriete?.clesDeCharges || [createDefaultCle()],
      lots: data.copropriete?.lots || [],
      presences: data.presences || {},
      representations: data.representations || {},
      externalRepresentatives: data.externalRepresentatives || {},
      lastSaved: data.exportedAt,
    }
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
    return null
  }
}

/**
 * Efface les données de localStorage
 */
export function clearState(): boolean {
  if (!isLocalStorageAvailable()) return false

  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    return false
  }
}

/**
 * Génère les données d'export
 */
export function generateExportData(state: SimulateurState): ExportData {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    copropriete: {
      nom: 'Ma copropriété',
      clesDeCharges: state.clesDeCharges,
      lots: state.lots,
    },
    presences: state.presences,
    representations: state.representations,
    externalRepresentatives: state.externalRepresentatives,
  }
}

/**
 * Exporte les données en fichier JSON téléchargeable
 */
export function exportToFile(state: SimulateurState): void {
  const data = generateExportData(state)
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `copropriete-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Valide les données importées (compatible ancien et nouveau format)
 */
export function validateImportData(data: unknown): ExportData | null {
  if (!data || typeof data !== 'object') return null

  const importData = data as Partial<ExportData> & {
    copropriete?: {
      nom?: string
      clesDeCharges?: ExportData['copropriete']['clesDeCharges']
      lots?: Array<{
        id?: string
        numero?: string
        nom?: string
        // Ancien format
        tantiemes?: number
        // Nouveau format
        tantièmesParCle?: Record<string, number>
      }>
    }
  }

  // Vérifier la structure minimale
  if (!importData.version || !importData.copropriete) {
    return null
  }

  // Vérifier les lots
  if (
    !Array.isArray(importData.copropriete.lots) ||
    importData.copropriete.lots.length === 0
  ) {
    return null
  }

  // Clés de charges (ou clé par défaut si absent)
  const clesDeCharges =
    importData.copropriete.clesDeCharges || [createDefaultCle()]

  // Valider et migrer chaque lot
  const migratedLots = []
  for (const lot of importData.copropriete.lots) {
    if (
      !lot.id ||
      typeof lot.id !== 'string' ||
      !lot.numero ||
      typeof lot.numero !== 'string'
    ) {
      return null
    }

    // Migrer ancien format vers nouveau format
    let tantièmesParCle: Record<string, number>

    if (lot.tantièmesParCle && typeof lot.tantièmesParCle === 'object') {
      // Nouveau format
      tantièmesParCle = lot.tantièmesParCle
    } else if (typeof lot.tantiemes === 'number' && lot.tantiemes > 0) {
      // Ancien format - migrer vers le nouveau
      tantièmesParCle = { 'charges-generales': lot.tantiemes }
    } else {
      return null
    }

    migratedLots.push({
      id: lot.id,
      numero: lot.numero,
      nom: lot.nom,
      tantièmesParCle,
    })
  }

  return {
    version: importData.version,
    exportedAt: importData.exportedAt || new Date().toISOString(),
    copropriete: {
      nom: importData.copropriete.nom || 'Ma copropriété',
      clesDeCharges,
      lots: migratedLots,
    },
    presences: importData.presences || {},
    representations: importData.representations || {},
    externalRepresentatives: importData.externalRepresentatives || {},
  }
}

/**
 * Importe les données depuis un fichier (JSON ou CSV)
 */
export function importFromFile(file: File): Promise<ExportData | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    const isCSV = file.name.toLowerCase().endsWith('.csv') ||
      file.type === 'text/csv' ||
      file.type === 'application/vnd.ms-excel'

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string

        if (isCSV) {
          // Import CSV
          const data = importFromCSV(content)
          resolve(data)
        } else {
          // Import JSON
          const data = JSON.parse(content)
          const validated = validateImportData(data)
          resolve(validated)
        }
      } catch (error) {
        console.error('Erreur lors de l\'import:', error)
        resolve(null)
      }
    }

    reader.onerror = () => {
      resolve(null)
    }

    reader.readAsText(file)
  })
}

/**
 * Fusionne l'état initial avec les données chargées
 */
export function mergeWithInitialState(
  loadedState: Partial<SimulateurState> | null
): SimulateurState {
  if (!loadedState) return initialState

  return {
    ...initialState,
    ...loadedState,
    // Toujours réinitialiser ces valeurs
    activeTab: 'copropriete',
    editingLotId: null,
    selectedMajority: 'art24',
    votes: {},
  }
}
