-- Retire les policies « tout compte connecté » des tables cles_* et devis_mutation_*.
--
-- Ces policies étaient `using (auth.uid() is not null)` : elles n'exigeaient qu'une
-- session Supabase Auth, sans regarder le rôle. Or l'inscription publique est ouverte
-- (auth settings : disable_signup = false) et l'anon key est exposée côté navigateur —
-- n'importe quel compte « visiteur » auto-inscrit pouvait donc lire et écrire ces tables
-- en direct via PostgREST, sans jamais passer par les routes API ni par requireAdmin().
-- cles_factures.owner_snapshot contient de l'identité et des montants de copropriétaires.
--
-- Aucune régression fonctionnelle attendue : les routes /api/cles/* et /api/devis-mutation
-- accèdent à ces tables avec la clé service-role (createClesAdminClient), qui contourne
-- RLS. Ces policies ne servaient donc à aucun usage légitime de l'application.
--
-- Après cette migration, ces tables reviennent au deny-by-default appliqué à toutes les
-- tables venator_* : RLS activée, aucune policy, accès service-role uniquement.

-- cles_inventaire
drop policy if exists "auth user reads inventaire" on cles_inventaire;
drop policy if exists "auth user inserts inventaire" on cles_inventaire;
drop policy if exists "auth user updates inventaire" on cles_inventaire;
drop policy if exists "auth user deletes inventaire" on cles_inventaire;

-- cles_factures
drop policy if exists "auth user reads factures" on cles_factures;
drop policy if exists "auth user inserts factures" on cles_factures;
drop policy if exists "auth user updates factures" on cles_factures;

-- cles_remises
drop policy if exists "auth user reads remises" on cles_remises;
drop policy if exists "auth user inserts remises" on cles_remises;
drop policy if exists "auth user updates remises" on cles_remises;
drop policy if exists "auth user deletes remises" on cles_remises;

-- devis_mutation_settings
drop policy if exists "auth user reads settings" on devis_mutation_settings;
drop policy if exists "auth user updates settings" on devis_mutation_settings;

-- Ceinture et bretelles : la RLS reste active sur les 4 tables.
alter table cles_inventaire enable row level security;
alter table cles_factures enable row level security;
alter table cles_remises enable row level security;
alter table devis_mutation_settings enable row level security;
