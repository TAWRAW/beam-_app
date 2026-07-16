import { describe, it, expect } from 'vitest'
import { createFakeDb } from '../services/_fake-db'
import { resolveRole } from '../services/role-resolver'

describe('role-resolver', () => {
  it('bootstrap : table vide + email inconnu => admin, ligne insérée', async () => {
    const { client, tables } = createFakeDb()
    const role = await resolveRole(client, 'premier@beamo.fr')
    expect(role).toBe('admin')
    const rows = tables.get('venator_users') ?? []
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ email: 'premier@beamo.fr', role: 'admin', invited_by: 'bootstrap' })
  })

  it('utilisateur connu actif => son rôle', async () => {
    const { client } = createFakeDb()
    await client.from('venator_users').insert({ email: 'gestion@beamo.fr', role: 'gestionnaire' })
    const role = await resolveRole(client, 'gestion@beamo.fr')
    expect(role).toBe('gestionnaire')
  })

  it('SÉCURITÉ : utilisateur désactivé => refusé, même seul en base et même sans autre admin (pas de re-bootstrap)', async () => {
    // Régression : sous l'ANCIENNE logique, le bootstrap se déclenchait dès qu'AUCUNE ligne
    // avec role='admin' n'existait — sans regarder disabled_at. Une ligne désactivée dont le
    // rôle stocké n'est pas 'admin' (ex. ex-gestionnaire révoqué) passait donc ce filtre et se
    // faisait ré-bootstraper admin. Ce test est RED contre l'ancienne logique, GREEN contre la nouvelle.
    const { client, tables } = createFakeDb()
    await client.from('venator_users').insert({ email: 'revoque@beamo.fr', role: 'gestionnaire', disabled_at: new Date().toISOString() })
    const role = await resolveRole(client, 'revoque@beamo.fr')
    expect(role).toBeNull()
    // aucune ligne supplémentaire n'a été insérée (pas de re-bootstrap) et le rôle stocké n'a pas été promu
    const rows = tables.get('venator_users') ?? []
    expect(rows).toHaveLength(1)
    expect(rows[0].disabled_at).toBeTruthy()
    expect(rows[0].role).toBe('gestionnaire')
  })

  it('email inconnu quand la table est NON vide => refusé, pas de bootstrap', async () => {
    const { client, tables } = createFakeDb()
    await client.from('venator_users').insert({ email: 'existant@beamo.fr', role: 'gestionnaire' })
    const role = await resolveRole(client, 'nouveau@beamo.fr')
    expect(role).toBeNull()
    const rows = tables.get('venator_users') ?? []
    expect(rows).toHaveLength(1)
  })
})
