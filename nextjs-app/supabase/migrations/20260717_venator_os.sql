-- supabase/migrations/20260717_venator_os.sql
-- Ordre de Service émis depuis un ticket (miroir de l'OS natif Estale KanbanEventOrder).
create type venator_os_statut as enum ('brouillon','envoye','erreur');
create table venator_os (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references venator_tickets(id) on delete cascade,
  copro_id uuid not null references venator_copros(id),
  prestataire_nom text not null,
  objet text not null,
  estale_task_id text,          -- id de la tâche kanban Estale porteuse
  estale_event_id text,         -- id du KanbanEventOrder
  statut venator_os_statut not null default 'brouillon',
  erreur text,                  -- message si statut='erreur'
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index on venator_os (ticket_id);
alter table venator_os enable row level security;
