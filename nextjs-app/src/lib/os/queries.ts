// Requêtes Estale pour le module Ordre de Service.
// Portées depuis l'extension Chrome estale-os-express (src/estale/queries.ts).
//
// Quirks API Estale (vérifiés en live 2026-06-18) :
// - condo(id:)/establishment(id:) exigent une variable $id:ID! NON-NULL (un ID nullable
//   ou un littéral inline → erreur serveur générique « Oupss une erreur s'est produite »).
// - l'argument `archived` doit être passé comme variable $a:Boolean! (pas en littéral inline).
// - les fournisseurs sont scopés PAR COPROPRIÉTÉ : condo(id){ suppliers }, PAS
//   establishment.suppliers (qui échoue via cette API).
import type { GqlFn, Me, CondoLite, SupplierLite, OwnerLite } from './types'

export async function loadMe(gqlFn: GqlFn): Promise<Me> {
  const d = await gqlFn<{ me: Me }>(`query {
    me { id fullname
      collaborator { id fullname email }
      establishment { id name } } }`)
  return d.me
}

export async function loadCondos(gqlFn: GqlFn): Promise<CondoLite[]> {
  const d = await gqlFn<{ me: { establishment: { condos: CondoLite[] } | null } }>(
    `query($a:Boolean!){ me { establishment { condos(archived:$a){ id name reference } } } }`,
    { a: false },
  )
  return d.me.establishment?.condos ?? []
}

/**
 * Fournisseurs (+ contacts) d'une copropriété. Le filtrage par terme se fait côté UI
 * (l'API n'expose pas de recherche fiable ici). $id:ID! obligatoire, $a:Boolean! obligatoire.
 */
export async function loadCondoSuppliers(gqlFn: GqlFn, condoID: string): Promise<SupplierLite[]> {
  const d = await gqlFn<{ condo: { suppliers: SupplierLite[] } }>(
    `query($id:ID!,$a:Boolean!){ condo(id:$id){
      suppliers(archived:$a){ id name contacts(archived:$a){ id name email phone } } } }`,
    { id: condoID, a: false },
  )
  return d.condo.suppliers ?? []
}

export async function loadOwners(gqlFn: GqlFn, condoID: string): Promise<OwnerLite[]> {
  const d = await gqlFn<{ condo: { owners: OwnerLite[] } }>(
    `query($id:ID!,$a:Boolean!){ condo(id:$id){ owners(archived:$a){ id fullname email phone } } }`,
    { id: condoID, a: false },
  )
  return d.condo.owners ?? []
}
