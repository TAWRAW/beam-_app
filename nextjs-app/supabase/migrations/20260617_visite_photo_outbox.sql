-- Migration: visite_photo_outbox
-- Seau de débordement transitoire pour les photos de visite qui ne peuvent
-- pas partir directement vers Estale (hors-ligne, fichier trop lourd > 4,5 Mo,
-- upload interrompu). Le blob HD est déposé dans le bucket Storage
-- 'visite-photos-overflow', puis drainé vers Estale (gardien / source de vérité)
-- par le client (boucle flushAll) ou, en phase 2, par un cron serveur.
-- Une fois la photo confirmée sur Estale : status='done' + blob Storage supprimé.

create table if not exists visite_photo_outbox (
  photo_uuid uuid primary key,                       -- = PhotoDraft.localId (clé d'idempotence)
  estale_visit_id text not null,                     -- requis pour pousser vers Estale
  estale_comment_id text not null,
  comment_local_id uuid,                             -- traçabilité côté client (optionnel)
  storage_path text not null,                        -- chemin du blob dans le bucket
  filename text not null,
  mime_type text,
  status text not null default 'pending'
    check (status in ('pending', 'uploading', 'done', 'error')),
  estale_file_id text,                               -- posé au succès → garde anti-doublon
  attempts int not null default 0 check (attempts >= 0),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table visite_photo_outbox is
  'Seau de débordement transitoire des photos de visite vers Estale. Purgé du blob après confirmation Estale (status=done).';

create index if not exists visite_photo_outbox_status_idx
  on visite_photo_outbox (status, created_at);

-- Trigger updated_at
create or replace function tg_visite_photo_outbox_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_visite_photo_outbox_updated_at on visite_photo_outbox;
create trigger set_visite_photo_outbox_updated_at
  before update on visite_photo_outbox
  for each row execute function tg_visite_photo_outbox_updated_at();

-- RLS deny-by-default : aucune policy => seul service_role (routes API beam-app,
-- requireAdmin) accède. Le client n'écrit/lit jamais cette table directement.
alter table visite_photo_outbox enable row level security;

-- Bucket Storage privé pour les blobs HD en débordement.
-- Upload via URL signée (createSignedUploadUrl, service_role) ; download/remove
-- côté serveur (service_role). Pas de policy storage nécessaire (service_role bypass).
insert into storage.buckets (id, name, public)
values ('visite-photos-overflow', 'visite-photos-overflow', false)
on conflict (id) do nothing;
