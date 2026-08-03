-- État de vote d'un dossier — remplace le booléen `travaux_vote`.
--
-- `travaux_vote` disait « ce marché A ÉTÉ voté » : il regardait le passé, et ne
-- concernait que les travaux. Ce qui manquait, c'est l'inverse — « ce sujet ATTEND
-- un vote » — et pour tous les types : un contrat se vote, une procédure aussi.
--
-- La vue « Prochaine AG » d'une copropriété devient alors ses dossiers `a_voter`.
-- Après l'assemblée, chacun passe à `vote`, `refuse` ou `reporte` et la vue se vide
-- d'elle-même : rien à nettoyer, aucun tag à dater. Un dossier `reporte` — voir la
-- reprise ci-dessous — revient de lui-même dans l'assemblée suivante.

alter table venator_dossiers
  add column if not exists vote_statut text not null default 'sans_objet'
    check (vote_statut in ('sans_objet','a_voter','vote','refuse','reporte'));

-- Reprise de l'existant : ce qui était voté le reste. Les travaux NON votés
-- deviennent `sans_objet`, et non `a_voter` : tous les projets ne passent pas en
-- assemblée (travaux conservatoires, urgences), et pré-remplir la vue « Prochaine
-- AG » de sujets qui n'y vont pas la rendrait inutilisable dès le premier usage.
-- C'est à l'humain d'y inscrire ce qui doit être voté.
update venator_dossiers set vote_statut = 'vote' where travaux_vote = true;

-- `travaux_vote` n'est PAS supprimée ici, volontairement. La production déployée
-- écrit encore dans cette colonne : la retirer avant le déploiement du nouveau
-- code ferait échouer sa bascule projet/voté. La colonne devient inerte (plus
-- personne ne la lit) et sera supprimée par une migration ultérieure, une fois le
-- nouveau code en ligne. Cette migration est donc sans risque, appliquée seule.

-- L'index sert la seule question posée à chaque préparation d'assemblée : « que
-- reste-t-il à voter dans cette copropriété ? ». Il couvre `reporte` autant que
-- `a_voter`, puisque c'est aussi la réponse — un sujet reporté revient de
-- lui-même à l'assemblée suivante, sans que personne ait à le remettre.
create index if not exists venator_dossiers_prochaine_ag_idx
  on venator_dossiers (copro_id)
  where vote_statut in ('a_voter','reporte');
