-- Table des « notes d'information Beamô » envoyées par Resend.
-- À exécuter UNE FOIS dans le SQL Editor de Supabase (comme social-queue.sql).
--
-- C'est la trace pérenne des envois : contenu, cible, destinataires et statuts de
-- réception, avec rattachement optionnel à un dossier Venator. Elle survivra à Estale.

create table if not exists mailing_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  copro_estale_id text not null,
  copro_ref text not null,
  copro_nom text not null,

  -- « BÂTIMENT A », « ESCALIER B »… null = envoi général (toute la copropriété)
  cible text,
  type_note text not null,
  objet text not null,
  corps text not null,

  canal text not null default 'resend',
  -- lien facultatif vers un dossier Venator (le journal du dossier reçoit aussi une entrée)
  dossier_id uuid references venator_dossiers(id) on delete set null,

  -- [{ email, resend_id, statut, erreur, maj_at }] — statut = dernier évènement Resend
  envois jsonb not null default '[]'::jsonb,
  nb_destinataires int not null default 0,
  nb_echecs int not null default 0,
  statuts_maj_at timestamptz
);

create index if not exists mailing_notes_dossier_idx on mailing_notes (dossier_id);
create index if not exists mailing_notes_copro_idx on mailing_notes (copro_ref, created_at desc);

-- Accès uniquement côté serveur (service_role, qui contourne RLS) : aucune policy publique.
alter table mailing_notes enable row level security;
