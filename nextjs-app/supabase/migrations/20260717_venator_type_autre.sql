-- supabase/migrations/20260717_venator_type_autre.sql
-- Ajoute la valeur 'autre' à l'enum des types de dossier. (ADD VALUE = hors transaction, OK via SQL editor.)
alter type venator_dossier_type add value if not exists 'autre';
