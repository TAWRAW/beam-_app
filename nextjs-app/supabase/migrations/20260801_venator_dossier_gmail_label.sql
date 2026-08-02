-- supabase/migrations/20260801_venator_dossier_gmail_label.sql
-- Liaison d'un dossier Venator à un libellé Gmail.
--
-- On stocke l'ID Gmail (stable : il survit à un renommage du libellé) ET le
-- chemin complet. Le chemin sert à désambiguïser — « Toiture » existe sous
-- plusieurs copropriétés — tandis que l'interface n'affiche que le dernier
-- segment, conformément au choix retenu.
--
-- Le nom est dupliqué en base pour afficher la liaison sans appeler l'API Gmail
-- à chaque rendu de fiche ; il est rafraîchi à chaque relève.

alter table venator_dossiers
  add column if not exists gmail_label_id text,
  add column if not exists gmail_label_chemin text,
  add column if not exists gmail_last_sync timestamptz;

-- Index partiel : seuls les dossiers liés sont parcourus par la relève.
create index if not exists venator_dossiers_gmail_label_idx
  on venator_dossiers (gmail_label_id)
  where gmail_label_id is not null;
