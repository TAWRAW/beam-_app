-- supabase/migrations/20260805_venator_equipements_categorie_libre.sql
-- La liste fermée (interphone/portail/toiture/menage/autre) posée dans
-- 20260805_venator_equipements_cadences.sql s'est avérée trop courte dès le
-- premier usage réel (VMC, chauffage…). Une taxonomie figée manquera toujours
-- un cas : categorie redevient du texte libre, comme nom.
--
-- Migration transactionnelle normale (pas d'ALTER TYPE ici, categorie était un
-- simple CHECK sur une colonne text, pas un enum Postgres).
do $$
declare
  c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'venator_equipements'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%categorie%';
  if c is not null then
    execute format('alter table venator_equipements drop constraint %I', c);
  end if;
end $$;
