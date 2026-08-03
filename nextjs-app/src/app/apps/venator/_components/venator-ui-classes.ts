// Vocabulaire de style partagé du module Venator.
//
// Deux rôles :
//  1. Surcharger les primitives shadcn/Radix (Dialog, Select, Input) qui héritent
//     par défaut de tokens partagés potentiellement invalides (cf. note technique
//     dans le plan — hsl(var(--x)) alors que globals.css définit --x en rgb(...))
//     ou de couleurs codées en dur avec !important (`!bg-white`).
//  2. Tenir en un seul endroit les décisions de direction artistique, pour que
//     "un bouton primaire" ait exactement le même rendu partout.
//
// Règles de la refonte :
//  — On sépare les blocs par le FOND et l'espace, pas par un trait. Les bordures
//    ne subsistent que là où un contour est fonctionnellement nécessaire (champs
//    de saisie, surfaces flottantes au-dessus de contenu imprévisible).
//  — Le jaune est rationné : CTA principal, état actif, signal d'urgence. Jamais
//    en aplat de navigation ni en taxonomie (les types de dossier sont neutres).
//  — Pas de pilules : boutons et pastilles rectangulaires à coins courts.

export const venatorDialogContent = '!bg-venator-surface border-venator-border text-venator-fg'

export const venatorSelectTrigger = 'border-venator-border-strong bg-venator-bg text-venator-fg data-[placeholder]:text-venator-fg-muted focus:ring-venator-accent'

export const venatorSelectContent = '!bg-venator-surface border-venator-border text-venator-fg'

export const venatorSelectItem = 'focus:bg-venator-surface-hover focus:text-venator-fg'

export const venatorInput = 'border-venator-border-strong bg-venator-bg text-venator-fg placeholder:text-venator-fg-muted focus-visible:ring-venator-accent'

export const venatorLabel = 'text-xs font-medium text-venator-fg-muted'

export const venatorButtonPrimary =
  'rounded-[var(--venator-radius-btn)] bg-venator-accent text-venator-accent-foreground text-[13px] font-semibold shadow-none hover:brightness-95'

export const venatorButtonSecondary =
  'rounded-[var(--venator-radius-btn)] border-0 bg-transparent text-[13px] font-medium text-venator-fg-muted shadow-none hover:bg-venator-surface-2 hover:text-venator-fg'

/**
 * Action de validation contextuelle (ajouter au journal, créer une étape…).
 *
 * Remplie, donc clairement cliquable, mais neutre : le jaune reste réservé au
 * CTA principal de l'écran et à la validation d'un dialog. Trois aplats jaunes
 * simultanés à l'écran annulent la hiérarchie qu'ils sont censés créer.
 */
export const venatorButtonNeutral =
  'rounded-[var(--venator-radius-btn)] border-0 bg-venator-surface-2 text-[13px] font-medium text-venator-fg shadow-none hover:bg-venator-surface-hover'

/** Micro-label typographique (type de dossier, source d'un message…) — du texte,
 *  pas une puce : c'est ce qui distingue une UI dense d'une UI encombrée. */
export const venatorMicroLabel =
  'text-[10.5px] font-semibold uppercase tracking-[0.08em] text-venator-fg-faint'

/**
 * Item des rails de navigation (copropriété, type de dossier).
 *
 * L'état actif se lit à la barre d'accent de 2px et au passage du texte en blanc
 * plein — pas à un aplat jaune. Un aplat saturé sur une liste de quinze entrées
 * écrase toute la page et fait remonter la navigation devant le contenu, alors
 * qu'elle doit rester en arrière-plan.
 */
export function venatorNavItem(active: boolean) {
  return [
    'relative rounded-[var(--venator-radius-btn)] py-1.5 pl-3 pr-2 text-left text-[13px] transition-colors',
    'before:absolute before:left-0 before:top-1/2 before:h-3.5 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:transition-colors',
    active
      ? 'bg-venator-surface font-medium text-venator-fg before:bg-venator-accent'
      : 'font-normal text-venator-fg-muted before:bg-transparent hover:bg-venator-surface hover:text-venator-fg',
  ].join(' ')
}

/**
 * Variante horizontale de venatorNavItem, pour le filtre par type posé en barre
 * au-dessus du contenu. Même grammaire d'état actif (surface + blanc plein +
 * accent), mais l'indicateur passe de la barre latérale au soulignement — un
 * trait vertical n'a pas de sens sur un élément posé dans une rangée.
 */
export function venatorNavChip(active: boolean) {
  return [
    'relative inline-flex shrink-0 items-center gap-1.5 rounded-[var(--venator-radius-btn)] px-2.5 pb-2 pt-1.5 text-[13px] transition-colors',
    'after:absolute after:inset-x-2.5 after:bottom-1 after:h-[2px] after:rounded-full after:transition-colors',
    active
      ? 'bg-venator-surface font-medium text-venator-fg after:bg-venator-accent'
      : 'font-normal text-venator-fg-muted after:bg-transparent hover:bg-venator-surface hover:text-venator-fg',
  ].join(' ')
}

/** Piste d'un contrôle segmenté (Liste/Board, Étapes/Fil) : l'onglet actif est
 *  une surface surélevée neutre, pas un aplat jaune. */
export const venatorSegmentedList =
  'h-8 gap-0.5 rounded-[var(--venator-radius-btn)] bg-venator-surface p-0.5'

export const venatorSegmentedTrigger =
  'h-7 rounded-[calc(var(--venator-radius-btn)-1px)] px-3 text-[13px] font-medium text-venator-fg-muted transition data-[state=active]:bg-venator-surface-hover data-[state=active]:text-venator-fg data-[state=active]:shadow-none'
