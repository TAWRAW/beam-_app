-- supabase/migrations/20260805_venator_equipements_cadences.sql
-- Suite à venator_type_entretien : référentiel d'équipements, échéance/lien
-- équipement sur les dossiers, cadence de relance visuelle (dashboard « Suivi
-- Entretien »), et gabarit par défaut du type 'entretien'.
--
-- ⚠️ Requiert que 20260804_venator_type_entretien.sql ait déjà été appliquée à
-- la main (le seed du gabarit ci-dessous référence la valeur d'enum 'entretien').

-- 1. Référentiel d'équipements par copropriété — étiquetage transverse (annoncé
--    dans 20260802_venator_type_contrat.sql), pas un type de dossier : un même
--    équipement peut être rattaché à plusieurs dossiers dans le temps (un
--    dépannage ponctuel, puis un jour un chantier voté).
create table if not exists venator_equipements (
  id uuid primary key default gen_random_uuid(),
  copro_id uuid not null references venator_copros(id) on delete cascade,
  nom text not null,
  categorie text not null check (categorie in ('interphone','portail','toiture','menage','autre')),
  created_at timestamptz not null default now()
);
create index if not exists venator_equipements_copro_idx on venator_equipements (copro_id);
alter table venator_equipements enable row level security;

-- 2. Lien optionnel équipement + échéance, sur TOUS les types de dossier (pas
--    réservé à 'entretien') : sert l'historique transversal d'un équipement.
alter table venator_dossiers
  add column if not exists equipement_id uuid references venator_equipements(id) on delete set null,
  add column if not exists echeance date;
create index if not exists venator_dossiers_equipement_idx
  on venator_dossiers (equipement_id) where equipement_id is not null;

-- 3. Cadence de relance visuelle : deux profils fixes (urgent / normal), chacun
--    une liste de seuils d'alerte en heures avant échéance. Calcul fait à
--    l'affichage (dashboard « Suivi Entretien »), aucune notification poussée,
--    aucun cron. priorite=1 -> profil 'urgent', 2 ou 3 -> 'normal' (pas de
--    nouveau champ urgence, cf. décision de cadrage).
create table if not exists venator_cadence_profils (
  profil text primary key check (profil in ('urgent','normal')),
  seuils_heures smallint[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table venator_cadence_profils enable row level security;
insert into venator_cadence_profils (profil, seuils_heures) values
  ('urgent', array[48,24,12]),
  ('normal', array[96])
on conflict (profil) do nothing;

-- 4. Gabarit par défaut du type 'entretien' : Signalement -> Devis/RDV ->
--    Réalisation -> Clôture. Idempotent : ne seed que si rien n'existe déjà
--    pour ce type (reste modifiable ensuite depuis Réglages > Dossiers).
insert into venator_gabarit_etapes (type, ordre, titre, echeance_offset_jours)
select 'entretien', v.ordre, v.titre, null
from (values (1,'Signalement'), (2,'Devis / RDV'), (3,'Réalisation'), (4,'Clôture')) as v(ordre, titre)
where not exists (select 1 from venator_gabarit_etapes where type = 'entretien');
