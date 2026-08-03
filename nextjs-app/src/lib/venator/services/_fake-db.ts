// src/lib/venator/services/_fake-db.ts — fake Supabase in-memory (TESTS UNIQUEMENT).
// Implémente la surface exacte utilisée par les services Venator. Pas exhaustif, pas destiné à la prod.
import { randomUUID } from 'crypto'

type Row = Record<string, any>

// Défauts de colonnes DB (cf. supabase/migrations/20260716_venator_initial.sql) que Postgres
// appliquerait via `default '...'` et que ce fake doit reproduire pour rester fidèle.
const TABLE_DEFAULTS: Record<string, Row> = {
  venator_dossiers: { statut: 'ouvert', priorite: 2, estale_refs: {}, vote_statut: 'sans_objet', closed_at: null },
  venator_dossier_etapes: { statut: 'a_faire' },
  venator_tickets: { statut: 'nouveau', type: 'intervention', closed_at: null },
  venator_checklist_items: { fait: false },
}

class DeleteQuery {
  private filters: [string, any][] = []
  constructor(private rows: Row[]) {}
  eq(col: string, val: any) { this.filters.push([col, val]); return this }
  then(resolve: (v: { data: null; error: null }) => void) {
    const toRemove = this.rows.filter(row => this.filters.every(([c, v]) => row[c] === v))
    for (const row of toRemove) { const i = this.rows.indexOf(row); if (i !== -1) this.rows.splice(i, 1) }
    resolve({ data: null, error: null })
  }
}

class Query {
  private filters: [string, any][] = []
  private dans: [string, any[]][] = []
  private orderBy: { col: string; asc: boolean } | null = null
  constructor(private rows: Row[]) {}
  eq(col: string, val: any) { this.filters.push([col, val]); return this }
  in(col: string, vals: any[]) { this.dans.push([col, vals]); return this }
  order(col: string, opts?: { ascending?: boolean }) { this.orderBy = { col, asc: opts?.ascending !== false }; return this }
  private result(): Row[] {
    let r = this.rows.filter(row =>
      this.filters.every(([c, v]) => row[c] === v) && this.dans.every(([c, vs]) => vs.includes(row[c])),
    )
    if (this.orderBy) { const { col, asc } = this.orderBy; r = [...r].sort((a, b) => (a[col] < b[col] ? -1 : 1) * (asc ? 1 : -1)) }
    return r
  }
  then(resolve: (v: { data: Row[]; error: null }) => void) { resolve({ data: this.result(), error: null }) }
  async maybeSingle() { const r = this.result(); return { data: r[0] ?? null, error: null } }
  async single() { const r = this.result(); return r[0] ? { data: r[0], error: null } : { data: null, error: { message: 'no rows' } } }
}

export function createFakeDb() {
  const tables = new Map<string, Row[]>()
  const get = (t: string) => { if (!tables.has(t)) tables.set(t, []); return tables.get(t)! }
  const client = {
    from(table: string) {
      const rows = get(table)
      return {
        select(_cols?: string) { return new Query(rows) },
        insert(payload: Row | Row[]) {
          const defaults = TABLE_DEFAULTS[table] ?? {}
          const arr = (Array.isArray(payload) ? payload : [payload]).map(p => ({ id: randomUUID(), created_at: new Date().toISOString(), ...defaults, ...p }))
          // contrainte unique gmail_message_id (dédup fil)
          for (const p of arr) {
            if (table === 'venator_fil_messages' && p.gmail_message_id && rows.some(r => r.gmail_message_id === p.gmail_message_id)) {
              const err = { code: '23505', message: 'duplicate key value violates unique constraint' }
              return { select: () => ({ single: async () => ({ data: null, error: err }) }), then: (res: any) => res({ data: null, error: err }) }
            }
          }
          rows.push(...arr)
          // Fidèle à supabase-js : insert SANS .select() ⇒ data: null ; .select() ⇒ tableau ; .select().single() ⇒ 1 ligne.
          return {
            select: () => ({ single: async () => ({ data: arr[0], error: null }), then: (res: any) => res({ data: arr, error: null }) }),
            then: (res: any) => res({ data: null, error: null }),
          }
        },
        update(patch: Row) {
          return { eq(col: string, val: any) {
            const matched = rows.filter(r => r[col] === val)
            matched.forEach(r => Object.assign(r, patch))
            return { select: () => ({ single: async () => ({ data: matched[0] ?? null, error: matched[0] ? null : { message: 'no rows' } }) }), then: (res: any) => res({ data: matched, error: null }) }
          } }
        },
        delete() { return new DeleteQuery(rows) },
      }
    },
  }
  return { client: client as any, tables }
}
