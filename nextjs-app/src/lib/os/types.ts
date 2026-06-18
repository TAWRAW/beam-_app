// Types partagés pour le module Ordre de Service (OS) Estale.
// Portés depuis l'extension Chrome estale-os-express (src/estale/types.ts).

export interface Me {
  id: string
  fullname: string
  collaborator: { id: string; fullname: string; email: string } | null
  establishment: { id: string; name: string } | null
}
export interface CondoLite {
  id: string
  name: string
  reference: string
}
export interface SupplierContact {
  id: string
  name: string
  email: string | null
  phone: string | null
}
export interface SupplierLite {
  id: string
  name: string
  contacts: SupplierContact[]
}
export interface OwnerLite {
  id: string
  fullname: string
  email: string | null
  phone: string | null
}

/** Fonction d'exécution GraphQL injectée (passe par le proxy /api/estale/graphql côté beam-app). */
export type GqlFn = <T>(query: string, variables?: Record<string, unknown>) => Promise<T>
