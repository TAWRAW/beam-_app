-- supabase/migrations/20260802_venator_drive.sql
-- Rattachement Google Drive, sur deux niveaux.
--
-- L'arborescence cible reprend la logique des libellés Gmail :
--   Copropriété  >  Type (Sinistre, Travaux, AG…)  >  Dossier
--   ex. 20 rue d'Albuféra / Sinistre / 202607 - DDE - Bât E - Martin
--
-- La copropriété porte son dossier Drive racine : c'est lui qui dit à Venator
-- OÙ créer. Le dossier de type intermédiaire n'est pas stocké — il se retrouve
-- par son nom à chaque fois, ce qui évite une référence de plus à maintenir
-- quand Tom réorganise son Drive.

alter table venator_copros
  add column if not exists drive_folder_id text;

alter table venator_dossiers
  add column if not exists drive_folder_id text,
  add column if not exists drive_folder_url text;   -- webViewLink, pour « Ouvrir dans Drive »
