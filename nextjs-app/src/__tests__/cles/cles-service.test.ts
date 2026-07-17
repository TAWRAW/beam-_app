import { describe, it, expect, beforeEach } from 'vitest'
import {
  roundMoney,
  ligneMontantHT,
  computeMontants,
  createInventaire,
  createRemise,
  createFacture,
  listRemisesNonFacturees,
  CleError,
} from '@/lib/cles/cles-service'

// ============================================================
// Faux client Supabase en mémoire (juste ce dont le service a besoin).
// ============================================================

interface Row {
  [k: string]: any
}

function createFakeDb(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = {
    cles_inventaire: seed.cles_inventaire ?? [],
    cles_remises: seed.cles_remises ?? [],
    cles_factures: seed.cles_factures ?? [],
  }
  let idCounter = 1000
  let factureSeq = 0

  function makeBuilder(table: string) {
    const state = {
      action: 'select' as 'select' | 'insert' | 'update' | 'delete',
      filters: [] as ((r: Row) => boolean)[],
      payload: null as Row | null,
    }

    const applyFilters = () =>
      tables[table].filter((r) => state.filters.every((f) => f(r)))

    function resolve(): { data: Row[]; error: { message: string } | null } {
      if (state.action === 'select') {
        return { data: applyFilters(), error: null }
      }
      if (state.action === 'insert') {
        const row = { id: `id-${idCounter++}`, ...state.payload }
        tables[table].push(row)
        return { data: [row], error: null }
      }
      if (state.action === 'update') {
        const matched = applyFilters()
        matched.forEach((r) => Object.assign(r, state.payload))
        return { data: matched, error: null }
      }
      // delete — simule on delete restrict pour l'inventaire référencé
      const matched = applyFilters()
      if (table === 'cles_inventaire') {
        const referenced = matched.some((r) =>
          tables.cles_remises.some((rem) => rem.cle_id === r.id),
        )
        if (referenced) return { data: [], error: { message: 'restrict' } }
      }
      tables[table] = tables[table].filter((r) => !matched.includes(r))
      return { data: [], error: null }
    }

    const builder: any = {
      select() {
        return builder
      },
      insert(obj: Row) {
        state.action = 'insert'
        state.payload = obj
        return builder
      },
      update(obj: Row) {
        state.action = 'update'
        state.payload = obj
        return builder
      },
      delete() {
        state.action = 'delete'
        return builder
      },
      eq(col: string, val: unknown) {
        state.filters.push((r) => r[col] === val)
        return builder
      },
      in(col: string, vals: unknown[]) {
        state.filters.push((r) => vals.includes(r[col]))
        return builder
      },
      is(col: string, val: unknown) {
        state.filters.push((r) => (r[col] ?? null) === val)
        return builder
      },
      order() {
        return builder
      },
      single() {
        const { data, error } = resolve()
        return Promise.resolve({ data: data[0] ?? null, error })
      },
      then(onF: any, onR: any) {
        return Promise.resolve(resolve()).then(onF, onR)
      },
    }
    return builder
  }

  return {
    from: (table: string) => makeBuilder(table),
    rpc: (_fn: string) =>
      Promise.resolve({
        data: `FAC-CLES-2026-${String(++factureSeq).padStart(4, '0')}`,
        error: null,
      }),
    _tables: tables,
  } as any
}

// ============================================================
// Helpers de calcul (purs)
// ============================================================

describe('helpers de calcul', () => {
  it('roundMoney arrondit à 2 décimales sans bug de flottant', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
    expect(roundMoney(19.999)).toBe(20)
    expect(roundMoney(12.345)).toBe(12.35)
  })

  it('ligneMontantHT = prix × quantité arrondi', () => {
    expect(ligneMontantHT(12.5, 3)).toBe(37.5)
    expect(ligneMontantHT(8.33, 3)).toBe(24.99)
  })

  it('computeMontants enchaîne HT → TVA → TTC', () => {
    const m = computeMontants([{ montant_ht: 100 }, { montant_ht: 50 }], 20)
    expect(m.montant_ht).toBe(150)
    expect(m.montant_tva).toBe(30)
    expect(m.montant_ttc).toBe(180)
  })

  it('computeMontants gère un taux de TVA différent', () => {
    const m = computeMontants([{ montant_ht: 200 }], 10)
    expect(m).toEqual({ montant_ht: 200, montant_tva: 20, montant_ttc: 220 })
  })
})

// ============================================================
// createRemise — décrément de stock
// ============================================================

describe('createRemise', () => {
  let db: any
  beforeEach(() => {
    db = createFakeDb({
      cles_inventaire: [
        { id: 'cle-1', estale_condo_id: 'c1', libelle: 'Badge A', type: 'badge', stock: 5, prix_unitaire_ht: 10 },
      ],
    })
  })

  it('décrémente le stock et crée la remise', async () => {
    const remise = await createRemise(db, {
      estale_condo_id: 'c1',
      cle_id: 'cle-1',
      cle_libelle: 'Badge A',
      cle_type: 'badge',
      estale_owner_id: 'o1',
      owner_nom: 'Menz Perry',
      quantite: 2,
    })
    expect(remise.quantite).toBe(2)
    expect(db._tables.cles_inventaire[0].stock).toBe(3)
    expect(db._tables.cles_remises).toHaveLength(1)
  })

  it('refuse si le stock est insuffisant et ne crée rien', async () => {
    await expect(
      createRemise(db, {
        estale_condo_id: 'c1',
        cle_id: 'cle-1',
        cle_libelle: 'Badge A',
        cle_type: 'badge',
        estale_owner_id: 'o1',
        owner_nom: 'Menz Perry',
        quantite: 99,
      }),
    ).rejects.toBeInstanceOf(CleError)
    expect(db._tables.cles_inventaire[0].stock).toBe(5)
    expect(db._tables.cles_remises).toHaveLength(0)
  })

  it('refuse une quantité nulle ou négative', async () => {
    await expect(
      createRemise(db, {
        estale_condo_id: 'c1',
        cle_id: 'cle-1',
        cle_libelle: 'Badge A',
        cle_type: 'badge',
        estale_owner_id: 'o1',
        owner_nom: 'X',
        quantite: 0,
      }),
    ).rejects.toBeInstanceOf(CleError)
  })
})

// ============================================================
// createFacture — depuis des remises non facturées
// ============================================================

describe('createFacture', () => {
  let db: any
  beforeEach(() => {
    db = createFakeDb({
      cles_inventaire: [
        { id: 'cle-1', estale_condo_id: 'c1', libelle: 'Badge A', type: 'badge', stock: 10, prix_unitaire_ht: 10 },
        { id: 'cle-2', estale_condo_id: 'c1', libelle: 'Télécommande', type: 'telecommande', stock: 10, prix_unitaire_ht: 25 },
      ],
      cles_remises: [
        { id: 'rem-1', estale_condo_id: 'c1', estale_owner_id: 'o1', cle_id: 'cle-1', owner_nom: 'Menz', quantite: 2, facture_id: null },
        { id: 'rem-2', estale_condo_id: 'c1', estale_owner_id: 'o1', cle_id: 'cle-2', owner_nom: 'Menz', quantite: 1, facture_id: null },
      ],
    })
  })

  it('crée une facture, calcule les montants et marque les remises', async () => {
    const facture = await createFacture(db, {
      estale_condo_id: 'c1',
      condo_ref: '00001',
      estale_owner_id: 'o1',
      owner_ref: '0001',
      owner_snapshot: { fullname: 'Menz Perry' },
      cabinet_snapshot: { name: 'Beamô' },
      remise_ids: ['rem-1', 'rem-2'],
    })

    // 2×10 + 1×25 = 45 HT → 9 TVA → 54 TTC
    expect(facture.montant_ht).toBe(45)
    expect(facture.montant_tva).toBe(9)
    expect(facture.montant_ttc).toBe(54)
    expect(facture.numero).toMatch(/^FAC-CLES-2026-\d{4}$/)
    expect(facture.lignes_snapshot).toHaveLength(2)
    expect(facture.condo_ref).toBe('00001')
    expect(facture.owner_ref).toBe('0001')

    // Les remises sont désormais facturées.
    const restantes = await listRemisesNonFacturees(db, 'c1', 'o1')
    expect(restantes).toHaveLength(0)
  })

  it('facture directement depuis l’inventaire (new_lignes) : crée la remise + décrémente le stock', async () => {
    const facture = await createFacture(db, {
      estale_condo_id: 'c1',
      condo_ref: '00001',
      estale_owner_id: 'o1',
      owner_ref: '0001',
      owner_nom: 'Menz Perry',
      owner_snapshot: { fullname: 'Menz Perry' },
      cabinet_snapshot: { name: 'Beamô' },
      new_lignes: [{ cle_id: 'cle-2', quantite: 3 }], // télécommande 25€ × 3 = 75 HT
    })
    expect(facture.montant_ht).toBe(75)
    expect(facture.montant_ttc).toBe(90)
    expect(facture.lignes_snapshot).toHaveLength(1)
    // stock cle-2 décrémenté de 10 → 7
    expect(db._tables.cles_inventaire.find((c: any) => c.id === 'cle-2').stock).toBe(7)
    // une nouvelle remise (qté 3) a été créée ET rattachée à la facture
    const billed = db._tables.cles_remises.filter(
      (r: any) => r.facture_id === facture.id,
    )
    expect(billed).toHaveLength(1)
    expect(billed[0].quantite).toBe(3)
  })

  it('mixe remises existantes + clés de l’inventaire', async () => {
    const facture = await createFacture(db, {
      estale_condo_id: 'c1',
      estale_owner_id: 'o1',
      owner_nom: 'Menz Perry',
      owner_snapshot: { fullname: 'Menz Perry' },
      cabinet_snapshot: {},
      remise_ids: ['rem-1'], // 2×10 = 20
      new_lignes: [{ cle_id: 'cle-2', quantite: 1 }], // 1×25 = 25
    })
    expect(facture.montant_ht).toBe(45)
    expect(facture.lignes_snapshot).toHaveLength(2)
  })

  it('refuse une remise déjà facturée', async () => {
    db._tables.cles_remises[0].facture_id = 'old-fac'
    await expect(
      createFacture(db, {
        estale_condo_id: 'c1',
        estale_owner_id: 'o1',
        owner_snapshot: {},
        cabinet_snapshot: {},
        remise_ids: ['rem-1'],
      }),
    ).rejects.toBeInstanceOf(CleError)
  })

  it('refuse une sélection vide', async () => {
    await expect(
      createFacture(db, {
        estale_condo_id: 'c1',
        estale_owner_id: 'o1',
        owner_snapshot: {},
        cabinet_snapshot: {},
        remise_ids: [],
      }),
    ).rejects.toBeInstanceOf(CleError)
  })

  it('refuse des remises d’un autre copropriétaire', async () => {
    await expect(
      createFacture(db, {
        estale_condo_id: 'c1',
        estale_owner_id: 'AUTRE',
        owner_snapshot: {},
        cabinet_snapshot: {},
        remise_ids: ['rem-1'],
      }),
    ).rejects.toBeInstanceOf(CleError)
  })
})

// sanity: createInventaire ajoute bien une ligne
describe('createInventaire', () => {
  it('insère une clé', async () => {
    const db = createFakeDb()
    const cle = await createInventaire(db, {
      estale_condo_id: 'c1',
      type: 'cle',
      libelle: 'Porte hall',
      stock: 3,
      prix_unitaire_ht: 12,
    })
    expect(cle.libelle).toBe('Porte hall')
    expect(db._tables.cles_inventaire).toHaveLength(1)
  })
})
