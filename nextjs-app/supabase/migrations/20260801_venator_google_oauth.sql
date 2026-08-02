-- supabase/migrations/20260801_venator_google_oauth.sql
-- Connexion Google du cabinet : libellés Gmail (lecture) + pièces Drive.
--
-- Le refresh token est stocké CHIFFRÉ (AES-256-GCM, src/lib/crypto/token-encryption.ts,
-- clé TOKENS_ENCRYPTION_KEY hors base). Même avec un accès en lecture à la table,
-- le jeton reste inexploitable sans la clé, qui vit dans l'environnement.
--
-- L'access token n'est jamais stocké : il vaut une heure et se redemande à partir
-- du refresh token.

create table if not exists venator_google_oauth (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,          -- compte Google relié (un seul en pratique)
  refresh_token_chiffre text not null,
  scopes text not null,                -- scopes réellement accordés, pour détecter un consentement partiel
  connected_at timestamptz not null default now(),
  last_refresh_at timestamptz          -- dernier échange refresh -> access réussi
);

-- RLS deny-by-default, comme toutes les tables Venator : accès service-role seul.
alter table venator_google_oauth enable row level security;
