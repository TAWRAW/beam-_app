-- Migration: visite_sync_heartbeat
-- Stocke le compte d'items en attente de sync vers estale,
-- alimenté par le client beam-app à chaque sauvegarde locale.

create table if not exists visite_sync_heartbeat (
  user_id uuid primary key references auth.users(id) on delete cascade,
  pending_count int not null default 0 check (pending_count >= 0),
  oldest_pending_at timestamptz,
  last_alert_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

comment on table visite_sync_heartbeat is
  'Heartbeat client beam-app pour alerte cron en cas de visites non synchronisées vers estale.';

-- RLS : un user ne voit / modifie que sa propre ligne ;
-- le cron côté serveur utilise service_role et bypasse.
alter table visite_sync_heartbeat enable row level security;

create policy "user reads own heartbeat"
  on visite_sync_heartbeat for select
  using (auth.uid() = user_id);

create policy "user upserts own heartbeat"
  on visite_sync_heartbeat for insert
  with check (auth.uid() = user_id);

create policy "user updates own heartbeat"
  on visite_sync_heartbeat for update
  using (auth.uid() = user_id);
