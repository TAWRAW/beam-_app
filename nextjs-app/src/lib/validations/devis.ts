import { z } from 'zod';

export const devisSchema = z.object({
  // Etape 1 - Localisation & Role
  ville: z.string().min(2, "Veuillez indiquer l'adresse de l'immeuble"),
  role: z.enum(['conseil_syndical', 'coproprietaire', 'autre'], {
    required_error: "Veuillez selectionner votre role"
  }),

  // Etape 2 - Besoin / Pain Point (1 ou 2 choix)
  motifs: z.array(z.enum([
    'reactivite',
    'transparence',
    'mise_concurrence',
    'immeuble_neuf',
    'autre'
  ])).min(1, "Veuillez selectionner au moins une raison").max(2, "Vous pouvez selectionner 2 raisons maximum"),
  autreDetail: z.string().optional(),

  // Etape 3 - Informations de contact
  nombreLots: z.enum(['moins_10', '10_20', '20_50', 'plus_50'], {
    required_error: "Veuillez indiquer la taille de la copropriete"
  }),
  prenom: z.string().min(2, "Prenom requis"),
  nom: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  telephone: z.string().regex(
    /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
    "Numero de telephone invalide"
  ),

  // Anti-spam (honeypot)
  website: z.string().max(0, "Spam detecte").optional(),
});

export type DevisFormData = z.infer<typeof devisSchema>;

// Schemas partiels pour validation par etape
export const stepOneSchema = devisSchema.pick({ ville: true, role: true });
export const stepTwoSchema = devisSchema.pick({ motifs: true, autreDetail: true });
export const stepThreeSchema = devisSchema.pick({
  nombreLots: true,
  prenom: true,
  nom: true,
  email: true,
  telephone: true
});

// Labels pour affichage
export const ROLE_LABELS: Record<string, string> = {
  conseil_syndical: 'Membre du Conseil Syndical',
  coproprietaire: 'Coproprietaire',
  autre: 'Autre',
};

export const MOTIF_LABELS: Record<string, string> = {
  reactivite: 'Manque de reactivite',
  transparence: 'Prix & transparence',
  mise_concurrence: 'Mise en concurrence',
  immeuble_neuf: 'Nouvel immeuble',
  autre: 'Autre',
};

export const TAILLE_LABELS: Record<string, string> = {
  moins_10: 'Moins de 10 lots',
  '10_20': '10 a 20 lots',
  '20_50': '20 a 50 lots',
  plus_50: 'Plus de 50 lots',
};
