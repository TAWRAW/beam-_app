-- supabase/migrations/20260804_venator_type_entretien.sql
-- Ajoute 'entretien' aux types de dossier : petites interventions récurrentes
-- (interphone, portail, ménage…), à distinguer de 'travaux' (marchés votés en AG).
--
-- ADD VALUE ne s'exécute pas dans une transaction : à passer seul dans le SQL editor,
-- exactement comme 20260717_venator_type_autre.sql et 20260802_venator_type_contrat.sql.
-- À appliquer À LA MAIN, AVANT le déploiement du code et AVANT
-- 20260805_venator_equipements_cadences.sql (qui seede le gabarit 'entretien' et
-- dépend donc de cette valeur d'enum).
alter type venator_dossier_type add value if not exists 'entretien' after 'travaux';
