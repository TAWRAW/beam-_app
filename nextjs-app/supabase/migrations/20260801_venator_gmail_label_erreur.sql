-- supabase/migrations/20260801_venator_gmail_label_erreur.sql
-- Signalement d'une liaison Gmail rompue.
--
-- Un libellé supprimé côté Gmail ne provoque aucune erreur : l'API répond par une
-- liste vide. Le dossier resterait donc muet sans que rien ne l'indique — c'est
-- exactement ce qui s'est produit sur une liaison créée avec un identifiant
-- erroné. La relève vérifie désormais l'existence du libellé et consigne ici le
-- motif, effacé dès que la liaison redevient valide.

alter table venator_dossiers
  add column if not exists gmail_label_erreur text;
