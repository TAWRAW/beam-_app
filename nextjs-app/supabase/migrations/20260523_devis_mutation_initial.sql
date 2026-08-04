-- Migration: devis_mutation_initial
-- Module Devis mutation (beam-app /apps/devis-mutation).
-- Wrapper léger qui pilote Estale : la Sale et le SaleDocument restent côté Estale,
-- beam-app gère uniquement le cycle de signature électronique côté vendeur.
--
-- Voir : Claude/Projets/Oignon - Module Devis copropriétaire (CDC).md
--        Claude/Références/Estale GraphQL — schéma mutation (Sale, SaleDocument, Owner, Agency).md

create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================

do $$ begin
  create type devis_mutation_type as enum ('PED', 'ED', 'OV');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type devis_signature_statut as enum (
    'draft', 'sent', 'signed', 'refused', 'expired', 'cancelled'
  );
exception when duplicate_object then null;
end $$;

-- ============================================================
-- Fonction trigger updated_at (utilisée par plusieurs tables ci-dessous)
-- ============================================================

create or replace function tg_devis_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- Paramètres tarifaires (1 ligne par type de devis)
-- Source de vérité pour les tarifs par défaut. Modifiables depuis
-- /apps/reglages. Le formulaire de création de devis lit ces valeurs et
-- les pré-remplit ; l'utilisateur peut les écraser au cas par cas
-- (snapshot persisté ensuite dans devis_signatures.montant_*_snapshot).
-- ============================================================

create table if not exists devis_mutation_settings (
  type devis_mutation_type primary key,
  libelle text not null,
  montant_ttc_default numeric(10,2) not null check (montant_ttc_default >= 0),
  taux_tva numeric(4,2) not null default 20 check (taux_tva >= 0 and taux_tva <= 100),
  actif boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

comment on table devis_mutation_settings is
  'Tarifs par défaut TTC pour chaque type de devis mutation. Source de vérité beam-app (les CondoSettings.sale.fees Estale ne pilotent rien).';

-- Seed initial — Tom modifie via /apps/reglages
insert into devis_mutation_settings (type, libelle, montant_ttc_default, taux_tva) values
  ('PED', 'Pré-état daté',  216.00, 20),
  ('ED',  'État daté',       300.00, 20),
  ('OV',  'Ordre de virement', 0.00, 20)
on conflict (type) do nothing;

drop trigger if exists devis_mutation_settings_set_updated_at on devis_mutation_settings;
create trigger devis_mutation_settings_set_updated_at
  before update on devis_mutation_settings
  for each row execute function tg_devis_set_updated_at();

-- ============================================================
-- Table principale : devis_signatures
-- Un devis = un cycle de signature électronique pour une vente Estale.
-- ============================================================

create table if not exists devis_signatures (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null, -- format DEV-YYYY-NNNN

  -- Références Estale (Estale = source de vérité)
  estale_sale_id text not null,
  estale_condo_id text not null,
  estale_lot_ids text[] not null check (cardinality(estale_lot_ids) >= 1),
  estale_owner_id text not null,

  -- Type & montants snapshot au moment de l'envoi (immutables après 'sent')
  type devis_mutation_type not null,
  prestation_libelle text not null,
  montant_ht_snapshot numeric(10,2) not null check (montant_ht_snapshot > 0),
  montant_tva_snapshot numeric(10,2) not null check (montant_tva_snapshot >= 0),
  montant_ttc_snapshot numeric(10,2) not null check (montant_ttc_snapshot > 0),
  taux_tva numeric(4,2) not null default 20,

  -- Snapshots JSON (client, cabinet, copropriété, lot) — au cas où Estale change
  client_snapshot jsonb not null,
  cabinet_snapshot jsonb not null,
  condo_snapshot jsonb not null,
  lot_snapshot jsonb not null,

  -- Workflow
  statut devis_signature_statut not null default 'draft',

  -- Token de signature (hash SHA-256 uniquement — le clair vit dans l'URL)
  token_hash text,

  -- Timestamps du cycle
  envoye_at timestamptz,
  expire_at timestamptz,
  signed_at timestamptz,
  refused_at timestamptz,
  cancelled_at timestamptz,

  -- Fichiers (Supabase Storage paths)
  pdf_original_path text,
  pdf_signe_path text,
  preuve_audit_path text,

  -- Push Estale post-signature
  estale_sale_document_id text,
  estale_pushed_at timestamptz,
  estale_billed_at timestamptz,

  -- Méta
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table devis_signatures is
  'Devis de mutation (PED/ED/OV) avec cycle de signature électronique. Estale reste source de vérité pour la Sale.';

create index if not exists idx_devis_signatures_statut          on devis_signatures(statut);
create index if not exists idx_devis_signatures_sale            on devis_signatures(estale_sale_id);
create index if not exists idx_devis_signatures_owner           on devis_signatures(estale_owner_id);
create index if not exists idx_devis_signatures_condo           on devis_signatures(estale_condo_id);
create index if not exists idx_devis_signatures_created_at      on devis_signatures(created_at desc);
create index if not exists idx_devis_signatures_created_by      on devis_signatures(created_by);
create index if not exists idx_devis_signatures_token_hash      on devis_signatures(token_hash) where token_hash is not null;

-- ============================================================
-- Numérotation chronologique DEV-YYYY-NNNN
-- ============================================================

create sequence if not exists devis_signatures_seq start 1;

create or replace function generate_devis_signature_numero()
returns text
language plpgsql
as $$
declare
  year_part text;
  num_part integer;
begin
  year_part := to_char(now() at time zone 'Europe/Paris', 'YYYY');
  num_part := nextval('devis_signatures_seq');
  return 'DEV-' || year_part || '-' || lpad(num_part::text, 4, '0');
end;
$$;

comment on function generate_devis_signature_numero() is
  'Génère un numéro chronologique de devis au format DEV-YYYY-NNNN. La séquence devra être réinitialisée au 1er janvier via cron pour repartir à 0001 chaque année.';

-- ============================================================
-- Trigger updated_at sur devis_signatures
-- ============================================================

drop trigger if exists devis_signatures_set_updated_at on devis_signatures;
create trigger devis_signatures_set_updated_at
  before update on devis_signatures
  for each row execute function tg_devis_set_updated_at();

-- ============================================================
-- Table audit trail : devis_signature_events
-- Piste d'audit eIDAS (toutes les actions sont tracées).
-- ============================================================

create table if not exists devis_signature_events (
  id uuid primary key default gen_random_uuid(),
  signature_id uuid not null references devis_signatures(id) on delete cascade,
  event_type text not null,
  -- Valeurs attendues : created | sent | opened | otp_sent | otp_validated |
  --                     signed | refused | expired | cancelled |
  --                     pdf_generated | pushed_estale | billed_estale | error
  event_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table devis_signature_events is
  'Piste d''audit eIDAS niveau 1 du cycle de signature. Conservation 10 ans.';

create index if not exists idx_devis_signature_events_signature
  on devis_signature_events(signature_id, created_at);
create index if not exists idx_devis_signature_events_type
  on devis_signature_events(event_type);

-- ============================================================
-- Table OTPs : devis_signature_otps
-- Codes à usage unique pour la signature (validité 10 min, max 5 tentatives).
-- ============================================================

create table if not exists devis_signature_otps (
  id uuid primary key default gen_random_uuid(),
  signature_id uuid not null references devis_signatures(id) on delete cascade,
  code_hash text not null,
  email_envoye text not null,
  expires_at timestamptz not null,
  tentatives integer not null default 0 check (tentatives between 0 and 5),
  validated_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table devis_signature_otps is
  'OTP email pour confirmation signature. Stockage du hash uniquement, max 5 tentatives.';

create index if not exists idx_devis_signature_otps_signature
  on devis_signature_otps(signature_id, created_at desc);

-- ============================================================
-- RLS
-- Les gestionnaires authentifiés ne voient/modifient que leurs propres devis.
-- Le service_role bypass automatiquement les RLS pour la page de signature
-- publique (qui n'a pas d'auth Supabase, juste validation du token).
-- ============================================================

alter table devis_mutation_settings enable row level security;
alter table devis_signatures        enable row level security;
alter table devis_signature_events  enable row level security;
alter table devis_signature_otps    enable row level security;

-- devis_mutation_settings : AUCUNE policy — deny-by-default, accès service-role
-- uniquement, comme toutes les tables venator_*.
--
-- Deux policies « tout utilisateur authentifié » (`auth.uid() is not null`) ont
-- été retirées d'ici le 03/08/2026, avant que cette migration n'ait jamais été
-- appliquée. Leur commentaire d'origine invoquait la protection du middleware sur
-- /apps/reglages — raisonnement faux : la RLS s'applique à PostgREST, que le
-- navigateur atteint directement avec l'anon key, sans passer par aucune page.
-- L'inscription publique étant ouverte, tout compte auto-inscrit aurait pu lire et
-- écrire ces réglages. Les mêmes policies existaient sur les tables cles_* et y ont
-- été supprimées (cf. 20260803_rls_cles_deny_by_default.sql).

-- devis_signatures
create policy "auth user reads own devis"
  on devis_signatures for select
  using (auth.uid() = created_by);

create policy "auth user inserts own devis"
  on devis_signatures for insert
  with check (auth.uid() = created_by);

create policy "auth user updates own devis"
  on devis_signatures for update
  using (auth.uid() = created_by);

-- devis_signature_events
create policy "auth user reads events of own devis"
  on devis_signature_events for select
  using (
    exists (
      select 1 from devis_signatures s
      where s.id = devis_signature_events.signature_id
        and s.created_by = auth.uid()
    )
  );

create policy "auth user inserts events of own devis"
  on devis_signature_events for insert
  with check (
    exists (
      select 1 from devis_signatures s
      where s.id = devis_signature_events.signature_id
        and s.created_by = auth.uid()
    )
  );

-- devis_signature_otps
create policy "auth user reads otps of own devis"
  on devis_signature_otps for select
  using (
    exists (
      select 1 from devis_signatures s
      where s.id = devis_signature_otps.signature_id
        and s.created_by = auth.uid()
    )
  );

create policy "auth user inserts otps of own devis"
  on devis_signature_otps for insert
  with check (
    exists (
      select 1 from devis_signatures s
      where s.id = devis_signature_otps.signature_id
        and s.created_by = auth.uid()
    )
  );

create policy "auth user updates otps of own devis"
  on devis_signature_otps for update
  using (
    exists (
      select 1 from devis_signatures s
      where s.id = devis_signature_otps.signature_id
        and s.created_by = auth.uid()
    )
  );
