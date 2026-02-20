import {
  ArrowUpDown,
  Flame,
  Wind,
  DoorOpen,
  Phone,
  Sparkles,
  Trees,
  type LucideIcon,
} from 'lucide-react'
import type { SupplierCondo, ContractEntry } from '@/schemas/document'

export const EQUIPMENT_TYPES: Record<
  string,
  { label: string; icon: LucideIcon; matchTags: string[] }
> = {
  ascenseur: {
    label: 'Ascenseur',
    icon: ArrowUpDown,
    matchTags: ['ASCENSEUR', 'ELEVATOR'],
  },
  chauffage: {
    label: 'Chauffage collectif',
    icon: Flame,
    matchTags: ['CHAUFFAGE', 'CHAUDIERE'],
  },
  vmc: {
    label: 'VMC',
    icon: Wind,
    matchTags: ['VMC', 'VENTILATION'],
  },
  portail: {
    label: 'Portail / Portillon',
    icon: DoorOpen,
    matchTags: ['PORTAIL', 'AUTOMATISME'],
  },
  interphone: {
    label: 'Interphone / Digicode',
    icon: Phone,
    matchTags: ['INTERPHONE', 'DIGICODE'],
  },
  nettoyage: {
    label: 'Nettoyage',
    icon: Sparkles,
    matchTags: ['NETTOYAGE', 'ENTRETIEN'],
  },
  espaces_verts: {
    label: 'Espaces verts',
    icon: Trees,
    matchTags: ['JARDINAGE', 'ESPACES_VERTS'],
  },
}

export function computeEnedisPhone(codePostal: string): string {
  if (!codePostal || codePostal.length < 2) return ''
  // DOM-TOM: 3 first digits (97X)
  const dept = codePostal.startsWith('97')
    ? codePostal.substring(0, 3)
    : codePostal.substring(0, 2)
  return `09 72 67 50 ${dept}`
}

export function normalizeCityKey(city: string): string {
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
}

export function autoMatchContracts(
  suppliers: SupplierCondo[]
): ContractEntry[] {
  const contracts: ContractEntry[] = []

  for (const [typeKey, equipType] of Object.entries(EQUIPMENT_TYPES)) {
    const matched = suppliers.find((s) =>
      s.tags?.some((tag) =>
        equipType.matchTags.some(
          (mt) => tag.toUpperCase().includes(mt)
        )
      )
    )
    if (matched) {
      contracts.push({
        equipmentType: typeKey,
        equipmentLabel: equipType.label,
        supplierName: matched.nom,
        supplierPhone: matched.telephone,
      })
    }
  }

  return contracts
}
