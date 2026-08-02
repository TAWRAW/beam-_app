-- supabase/migrations/20260731_venator_gabarits_reglages.sql
-- 1. Gabarits d'étapes personnalisables (écran Réglages) — remplacent les listes
--    d'étapes qui étaient codées en dur dans src/lib/venator/gabarits.ts.
--    Table vide au départ : un dossier créé sans gabarit défini n'a AUCUNE étape,
--    ce qui est le comportement voulu (plus d'étapes imposées par défaut).
-- 2. Travaux : distinction projet / voté en AG.

create table if not exists venator_gabarit_etapes (
  id uuid primary key default gen_random_uuid(),
  type venator_dossier_type not null,
  ordre smallint not null,
  titre text not null,
  echeance_offset_jours smallint,   -- null = pas d'échéance calculée à la création
  created_at timestamptz not null default now()
);
create index if not exists venator_gabarit_etapes_type_ordre_idx
  on venator_gabarit_etapes (type, ordre);

-- RLS deny-by-default, comme toutes les tables Venator : accès service-role seul.
alter table venator_gabarit_etapes enable row level security;

-- Marché de travaux : simple projet, ou voté en assemblée générale.
alter table venator_dossiers
  add column if not exists travaux_vote boolean not null default false;
