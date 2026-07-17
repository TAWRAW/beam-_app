-- Migration: cles_initial
-- Module Clés (beam-app /apps/cles) — gestion des clés physiques des parties
-- communes : inventaire par copro, historique des remises aux copropriétaires,
-- facturation (PDF d'imputation comptable).
--
-- Estale ne gère QUE les clés de répartition (tantièmes), pas les clés
-- physiques → beam-app + Supabase. Les copropriétaires sont tirés d'Estale
-- (cf. getOwnersByCondo, Owner.reference = réf copropriétaire 0001…).
--
-- Accès applicatif = routes API service-role + requireAdmin(). La RLS est une
-- défense en profondeur ; les données (inventaire/remises/factures) sont des
-- données CABINET PARTAGÉES → visibles par tout admin authentifié (pas de
-- cloisonnement par created_by, qui masquerait les saisies d'un employé).
--
-- Voir : Claude/Références/Estale GraphQL — schéma mutation (… owners par copro).

create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================

do $$ begin
  create type cle_type as enum ('badge', 'cle', 'telecommande', 'autre');
exception when duplicate_object then null;
end $$;

-- ============================================================
-- Fonction trigger updated_at (partagée par les 3 tables)
-- ============================================================

create or replace function tg_cles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- Table 1 : cles_inventaire — catalogue des clés par copropriété
-- ============================================================

create table if not exists cles_inventaire (
  id uuid primary key default gen_random_uuid(),

  -- Copropriété (Estale = source de vérité) + snapshot de la réf 0000X
  estale_condo_id text not null,
  condo_ref text,

  type cle_type not null default 'cle',
  libelle text not null,
  stock integer not null default 0 check (stock >= 0),
  prix_unitaire_ht numeric(10,2) not null default 0 check (prix_unitaire_ht >= 0),
  taux_tva numeric(4,2) not null default 20 check (taux_tva >= 0 and taux_tva <= 100),
  actif boolean not null default true,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table cles_inventaire is
  'Catalogue des clés physiques (badge/clé/télécommande) par copropriété, avec stock et tarif unitaire HT.';

create index if not exists idx_cles_inventaire_condo on cles_inventaire(estale_condo_id);
create index if not exists idx_cles_inventaire_actif on cles_inventaire(actif);

drop trigger if exists cles_inventaire_set_updated_at on cles_inventaire;
create trigger cles_inventaire_set_updated_at
  before update on cles_inventaire
  for each row execute function tg_cles_set_updated_at();

-- ============================================================
-- Table 2 : cles_factures — facture d'imputation comptable
-- (créée AVANT cles_remises car remises.facture_id la référence)
-- ============================================================

create table if not exists cles_factures (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null, -- format FAC-CLES-YYYY-NNNN

  -- Copropriété + copropriétaire (Estale) avec leurs réfs d'imputation
  estale_condo_id text not null,
  condo_ref text,
  estale_owner_id text not null,
  owner_ref text,

  -- Snapshots JSON figés au moment de l'émission
  owner_snapshot jsonb not null,
  cabinet_snapshot jsonb not null,
  lignes_snapshot jsonb not null, -- [{ libelle, type, quantite, prix_unitaire_ht, montant_ht }]

  montant_ht numeric(10,2) not null check (montant_ht >= 0),
  montant_tva numeric(10,2) not null check (montant_tva >= 0),
  montant_ttc numeric(10,2) not null check (montant_ttc >= 0),

  pdf_path text, -- chemin Supabase Storage (optionnel)

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table cles_factures is
  'Facture de clés destinée au comptable de copro : porte réf copro (0000X) + réf copropriétaire pour imputation sur le bon client.';

create index if not exists idx_cles_factures_condo on cles_factures(estale_condo_id);
create index if not exists idx_cles_factures_owner on cles_factures(estale_owner_id);
create index if not exists idx_cles_factures_created_at on cles_factures(created_at desc);

drop trigger if exists cles_factures_set_updated_at on cles_factures;
create trigger cles_factures_set_updated_at
  before update on cles_factures
  for each row execute function tg_cles_set_updated_at();

-- Numérotation chronologique FAC-CLES-YYYY-NNNN
create sequence if not exists cles_factures_seq start 1;

create or replace function generate_cles_facture_numero()
returns text
language plpgsql
as $$
declare
  year_part text;
  num_part integer;
begin
  year_part := to_char(now() at time zone 'Europe/Paris', 'YYYY');
  num_part := nextval('cles_factures_seq');
  return 'FAC-CLES-' || year_part || '-' || lpad(num_part::text, 4, '0');
end;
$$;

comment on function generate_cles_facture_numero() is
  'Génère un numéro de facture clés FAC-CLES-YYYY-NNNN. Séquence à réinitialiser au 1er janvier pour repartir à 0001.';

-- ============================================================
-- Table 3 : cles_remises — historique des clés remises (traçabilité)
-- ============================================================

create table if not exists cles_remises (
  id uuid primary key default gen_random_uuid(),

  estale_condo_id text not null,
  condo_ref text,

  cle_id uuid not null references cles_inventaire(id) on delete restrict,
  -- Snapshots de la clé au moment de la remise (libellé/type figés pour l'historique)
  cle_libelle text not null,
  cle_type cle_type not null default 'cle',

  -- Copropriétaire (Estale) + snapshots pour traçabilité durable
  estale_owner_id text not null,
  owner_ref text,
  owner_nom text not null,

  quantite integer not null check (quantite > 0),
  date_remise date not null default current_date,

  -- null = remise non encore facturée (piochée par l'onglet Facturer)
  facture_id uuid references cles_factures(id) on delete set null,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table cles_remises is
  'Historique des clés remises aux copropriétaires (qui, quoi, combien, quand). facture_id NULL = non facturée.';

create index if not exists idx_cles_remises_condo on cles_remises(estale_condo_id);
create index if not exists idx_cles_remises_owner on cles_remises(estale_owner_id);
create index if not exists idx_cles_remises_cle on cles_remises(cle_id);
create index if not exists idx_cles_remises_facture on cles_remises(facture_id);
create index if not exists idx_cles_remises_non_facturees
  on cles_remises(estale_condo_id, estale_owner_id) where facture_id is null;

drop trigger if exists cles_remises_set_updated_at on cles_remises;
create trigger cles_remises_set_updated_at
  before update on cles_remises
  for each row execute function tg_cles_set_updated_at();

-- ============================================================
-- RLS — deny-by-default + lecture/écriture pour tout admin authentifié.
-- (L'accès réel passe par les routes API service-role qui bypassent la RLS ;
--  ces policies couvrent un éventuel accès direct via la clé authentifiée.)
-- ============================================================

alter table cles_inventaire enable row level security;
alter table cles_factures   enable row level security;
alter table cles_remises    enable row level security;

-- cles_inventaire
drop policy if exists "auth user reads inventaire" on cles_inventaire;
create policy "auth user reads inventaire"
  on cles_inventaire for select using (auth.uid() is not null);
drop policy if exists "auth user inserts inventaire" on cles_inventaire;
create policy "auth user inserts inventaire"
  on cles_inventaire for insert with check (auth.uid() is not null);
drop policy if exists "auth user updates inventaire" on cles_inventaire;
create policy "auth user updates inventaire"
  on cles_inventaire for update using (auth.uid() is not null);
drop policy if exists "auth user deletes inventaire" on cles_inventaire;
create policy "auth user deletes inventaire"
  on cles_inventaire for delete using (auth.uid() is not null);

-- cles_factures
drop policy if exists "auth user reads factures" on cles_factures;
create policy "auth user reads factures"
  on cles_factures for select using (auth.uid() is not null);
drop policy if exists "auth user inserts factures" on cles_factures;
create policy "auth user inserts factures"
  on cles_factures for insert with check (auth.uid() is not null);
drop policy if exists "auth user updates factures" on cles_factures;
create policy "auth user updates factures"
  on cles_factures for update using (auth.uid() is not null);

-- cles_remises
drop policy if exists "auth user reads remises" on cles_remises;
create policy "auth user reads remises"
  on cles_remises for select using (auth.uid() is not null);
drop policy if exists "auth user inserts remises" on cles_remises;
create policy "auth user inserts remises"
  on cles_remises for insert with check (auth.uid() is not null);
drop policy if exists "auth user updates remises" on cles_remises;
create policy "auth user updates remises"
  on cles_remises for update using (auth.uid() is not null);
drop policy if exists "auth user deletes remises" on cles_remises;
create policy "auth user deletes remises"
  on cles_remises for delete using (auth.uid() is not null);
