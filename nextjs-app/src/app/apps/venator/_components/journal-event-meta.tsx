// Libellés + icônes des événements du journal technique — source de vérité
// unique (remplace l'ancien EVENEMENT_META qui utilisait des emojis et ne
// couvrait pas tous les événements réellement loggés côté serveur, cf.
// src/lib/venator/services/{dossiers,os,tickets,checklist}-service.ts).
import {
  CheckCircle2,
  CheckSquare,
  FolderPlus,
  Link2,
  Lock,
  Send,
  StickyNote,
  Ticket as TicketIcon,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react'

export const JOURNAL_EVENT_META: Record<string, { icon: LucideIcon; label: string }> = {
  note: { icon: StickyNote, label: 'Note' },
  checklist_complete: { icon: CheckCircle2, label: 'Checklist complétée' },
  dossier_cree: { icon: FolderPlus, label: 'Dossier créé' },
  etape_faite: { icon: CheckSquare, label: 'Étape faite' },
  dossier_clos: { icon: Lock, label: 'Dossier clos' },
  dossier_supprime: { icon: Trash2, label: 'Dossier supprimé' },
  os_emis: { icon: Send, label: 'OS émis' },
  os_erreur: { icon: TriangleAlert, label: "Échec d'émission OS" },
  ticket_cree: { icon: TicketIcon, label: 'Ticket créé' },
  ticket_rattache: { icon: Link2, label: 'Ticket rattaché' },
}

export const JOURNAL_EVENT_FALLBACK = { icon: StickyNote, label: 'Événement' }
