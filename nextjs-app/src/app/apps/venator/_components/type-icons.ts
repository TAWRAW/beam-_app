// Icônes Lucide par type de dossier / ticket / statut.
//
// Vit côté _components (et non dans src/lib/venator/labels.ts) pour garder
// labels.ts purement textuel et sans dépendance de rendu — le typage
// Record<DossierType, …> y assure déjà l'exhaustivité des libellés, on applique
// la même garantie ici : ajouter un type sans son icône casse le build.
//
// Les icônes ne sont posées que là où elles portent une information : des types
// tous distincts, des statuts. Une même icône répétée sur chaque ligne d'une
// liste n'ajoute rien et alourdit la lecture — on s'en abstient (rail copro).

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleDot,
  Building2,
  FileSignature,
  Hammer,
  type LucideIcon,
  MessageSquare,
  PauseCircle,
  Repeat,
  Scale,
  ShieldAlert,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react'
import type { DossierStatut, DossierType, TicketType } from '@/lib/venator/types'

export const DOSSIER_TYPE_ICONS: Record<DossierType, LucideIcon> = {
  sinistre: ShieldAlert,
  travaux: Hammer,
  contrat: FileSignature,
  procedure: Scale,
  mutation: Repeat,
  ag: Users,
  conseil_syndical: UserCheck,
  vie_copro: Building2,
  autre: CircleDashed,
}

/**
 * Couleur par type de dossier, pour identifier une carte d'un coup d'œil.
 *
 * Classes écrites en entier : Tailwind analyse le code source de façon statique,
 * une classe assemblée à l'exécution (`text-${x}-500`) ne serait jamais générée.
 *
 * Le niveau 500 est retenu parce qu'il tient sur les deux thèmes — assez soutenu
 * pour ressortir sur le fond clair, assez lumineux pour rester lisible sur le
 * quasi-noir. Ces teintes ne servent QUE la taxonomie : le jaune Beamô reste
 * l'unique accent d'interface (CTA, sélection, urgence).
 */
export const DOSSIER_TYPE_COULEURS: Record<DossierType, string> = {
  sinistre: 'text-slate-400',
  travaux: 'text-orange-500',
  // Vert : la couleur que Tom associait aux contrats dès le départ.
  contrat: 'text-emerald-500',
  procedure: 'text-violet-500',
  mutation: 'text-cyan-500',
  ag: 'text-red-500',
  conseil_syndical: 'text-blue-500',
  // Jaune Beamô, choisi par Tom : la vie de la copropriété porte la couleur de
  // la marque. Conséquence assumée — l'urgence ne peut plus se signaler par la
  // couleur seule, elle s'écrit désormais en toutes lettres sur la carte.
  vie_copro: 'text-venator-accent',
  // Rose : la seule teinte franchement distincte des sept autres. Le vert reste
  // libre, au cas où « Contrat » deviendrait un type à part entière.
  autre: 'text-pink-500',
}

/**
 * Même palette, appliquée au trait de l'onglet actif de la barre de types.
 *
 * Déclinaison séparée parce que Tailwind ne compose pas les variantes à
 * l'exécution : `after:` doit figurer dans la classe écrite en clair.
 */
export const DOSSIER_TYPE_COULEURS_BARRE: Record<DossierType, string> = {
  sinistre: 'after:bg-slate-400',
  travaux: 'after:bg-orange-500',
  contrat: 'after:bg-emerald-500',
  procedure: 'after:bg-violet-500',
  mutation: 'after:bg-cyan-500',
  ag: 'after:bg-red-500',
  conseil_syndical: 'after:bg-blue-500',
  vie_copro: 'after:bg-venator-accent',
  autre: 'after:bg-pink-500',
}

export const TICKET_TYPE_ICONS: Record<TicketType, LucideIcon> = {
  intervention: Wrench,
  demande: MessageSquare,
  signalement: AlertTriangle,
}

export const DOSSIER_STATUT_ICONS: Record<DossierStatut, LucideIcon> = {
  ouvert: Circle,
  en_cours: CircleDot,
  en_attente: PauseCircle,
  clos: CheckCircle2,
}

/**
 * Icône d'un `type` de ListItem, dont on ne sait au type système qu'il s'agit
 * d'une string. Les deux enums ont des clés disjointes (garanti par
 * labels.test.ts) : le lookup combiné est donc sans ambiguïté.
 */
export function iconForType(type: string): LucideIcon {
  return (
    DOSSIER_TYPE_ICONS[type as DossierType] ?? TICKET_TYPE_ICONS[type as TicketType] ?? CircleDashed
  )
}

/**
 * Couleur d'un `type` de ListItem.
 *
 * Les tickets restent neutres : ils ont leur propre taxonomie (intervention,
 * demande, signalement), sans rapport avec les types de dossier. Les colorer
 * avec la même palette laisserait croire à une correspondance qui n'existe pas.
 */
export function couleurPourType(type: string): string {
  return DOSSIER_TYPE_COULEURS[type as DossierType] ?? 'text-venator-fg-faint'
}
