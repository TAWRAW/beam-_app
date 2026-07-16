-- supabase/migrations/20260716_venator_initial.sql
-- Venator V1 : schéma socle. RLS deny-by-default (aucune policy) — accès service-role uniquement.

create type venator_role as enum ('admin','gestionnaire','invite');
create type venator_dossier_type as enum ('sinistre','travaux','procedure','mutation','ag','conseil_syndical','vie_copro');
create type venator_dossier_statut as enum ('ouvert','en_cours','en_attente','clos');
create type venator_etape_statut as enum ('a_faire','en_cours','fait','sautee');
create type venator_ticket_type as enum ('intervention','demande','signalement');
create type venator_ticket_statut as enum ('nouveau','os_envoye','planifie','realise','clos');
create type venator_fil_direction as enum ('entrant','sortant','note');
create type venator_fil_source as enum ('gmail','manuel','ia','venator');

create table venator_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role venator_role not null default 'invite',
  invited_by text,
  invited_at timestamptz not null default now(),
  disabled_at timestamptz,
  last_login_at timestamptz
);

create table venator_copros (
  id uuid primary key default gen_random_uuid(),
  estale_id text not null unique,
  reference text not null,          -- ex. '00013'
  nom text not null,
  created_at timestamptz not null default now()
);

create table venator_dossiers (
  id uuid primary key default gen_random_uuid(),
  copro_id uuid not null references venator_copros(id),
  type venator_dossier_type not null,
  titre text not null,
  statut venator_dossier_statut not null default 'ouvert',
  priorite smallint not null default 2 check (priorite between 1 and 3),
  gabarit_key text,
  estale_refs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index on venator_dossiers (copro_id);
create index on venator_dossiers (type, statut);

create table venator_dossier_etapes (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references venator_dossiers(id) on delete cascade,
  ordre smallint not null,
  titre text not null,
  statut venator_etape_statut not null default 'a_faire',
  echeance date,
  done_at timestamptz,
  notes text
);
create index on venator_dossier_etapes (dossier_id, ordre);

create table venator_tickets (
  id uuid primary key default gen_random_uuid(),
  copro_id uuid not null references venator_copros(id),
  dossier_id uuid references venator_dossiers(id) on delete set null,
  type venator_ticket_type not null default 'intervention',
  titre text not null,
  description text,
  statut venator_ticket_statut not null default 'nouveau',
  prestataire_nom text,             -- V1 : texte libre ; FK prestataires en V2 (OS)
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index on venator_tickets (copro_id, statut);
create index on venator_tickets (dossier_id);

create table venator_fil_messages (
  id uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('dossier','ticket')),
  parent_id uuid not null,
  direction venator_fil_direction not null default 'note',
  source venator_fil_source not null default 'manuel',
  from_email text,
  sujet text,
  contenu text not null,
  gmail_message_id text unique,     -- dédup add-on Gmail (V2)
  created_at timestamptz not null default now()
);
create index on venator_fil_messages (parent_type, parent_id, created_at);

create table venator_checklists (
  id uuid primary key default gen_random_uuid(),
  copro_id uuid not null references venator_copros(id) unique,
  created_at timestamptz not null default now()
);

create table venator_checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references venator_checklists(id) on delete cascade,
  ordre smallint not null,
  libelle text not null,
  categorie text not null,
  fait boolean not null default false,
  fait_at timestamptz,
  auto_check_key text               -- ex. 'lots_rentres' (auto-vérif Estale, V2)
);
create index on venator_checklist_items (checklist_id, ordre);

create table venator_journal (
  id uuid primary key default gen_random_uuid(),
  copro_id uuid not null references venator_copros(id),
  dossier_id uuid references venator_dossiers(id) on delete set null,
  ticket_id uuid references venator_tickets(id) on delete set null,
  type_evenement text not null,     -- ex. 'dossier_cree','etape_faite','ticket_cree','note'
  contenu text not null,
  acteur text not null default 'tom',  -- 'tom' | 'ia' | 'system'
  created_at timestamptz not null default now()
);
create index on venator_journal (copro_id, created_at desc);

create table venator_audit_log (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  action text not null,             -- ex. 'login','dossier_cree','role_change'
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS deny-by-default : activer sans policy sur TOUTES les tables.
alter table venator_users enable row level security;
alter table venator_copros enable row level security;
alter table venator_dossiers enable row level security;
alter table venator_dossier_etapes enable row level security;
alter table venator_tickets enable row level security;
alter table venator_fil_messages enable row level security;
alter table venator_checklists enable row level security;
alter table venator_checklist_items enable row level security;
alter table venator_journal enable row level security;
alter table venator_audit_log enable row level security;
