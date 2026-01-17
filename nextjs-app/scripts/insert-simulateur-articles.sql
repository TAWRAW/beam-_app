-- Script pour ajouter les articles SEO du simulateur de vote dans la base de données
-- À exécuter dans le SQL Editor de Supabase

-- Article 1 : Guide complet du simulateur de vote
INSERT INTO articles (
  slug,
  title,
  seo_title,
  excerpt,
  meta_description,
  content,
  category,
  type,
  status,
  reading_time_minutes,
  tags,
  published_at
) VALUES (
  'guide-simulateur-vote-assemblee-generale',
  'Comment utiliser le simulateur de vote en AG de copropriété',
  'Simulateur de vote AG copropriété : guide complet | Beamô',
  'Découvrez notre outil gratuit pour simuler les votes de votre assemblée générale de copropriété. Anticipez les résultats et maîtrisez les majorités.',
  'Guide complet du simulateur de vote en assemblée générale de copropriété. Calculez les majorités article 24, 25, 26 et anticipez les résultats de vos votes.',
  '# Comment utiliser le simulateur de vote en AG de copropriété

Vous préparez une assemblée générale de copropriété et vous vous demandez si vos résolutions ont des chances d''être adoptées ? Notre **simulateur de vote gratuit** vous permet d''anticiper les résultats avant le jour J.

## Pourquoi utiliser un simulateur de vote ?

Préparer une AG de copropriété peut s''avérer complexe. Entre les différentes majorités (article 24, 25, 26, unanimité), les tantièmes, les représentations et les passerelles, il est facile de s''y perdre.

Notre simulateur vous aide à :

- **Anticiper les résultats** de vos votes avant l''AG
- **Tester différents scénarios** de présence et de vote
- **Comprendre les majorités** et leur fonctionnement
- **Identifier les passerelles** possibles en cas de rejet

## Comment fonctionne le simulateur ?

### Étape 1 : Configurez votre copropriété

Commencez par saisir les lots de votre copropriété avec leurs tantièmes. Vous pouvez :
- Ajouter vos lots un par un
- Importer un fichier CSV ou JSON
- Gérer plusieurs clés de répartition

### Étape 2 : Simulez une AG

Définissez les présences à votre assemblée générale :
- Présents
- Représentés (avec choix du mandataire)
- Absents

Le tableau de bord affiche en temps réel les statistiques de présence et les majorités atteignables.

### Étape 3 : Simulez un vote

Choisissez la majorité requise et testez différents scénarios de vote. Le résultat s''affiche instantanément avec les passerelles applicables.

## Les majorités en copropriété

| Majorité | Condition | Exemples de décisions |
|----------|-----------|----------------------|
| Article 24 | Majorité des voix exprimées | Travaux d''entretien, approbation des comptes |
| Article 25 | Majorité de toutes les voix | Travaux d''amélioration, changement de syndic |
| Article 26 | Majorité des copropriétaires + 2/3 des tantièmes | Modification du règlement, aliénation |
| Unanimité | Accord de tous | Changement de destination de l''immeuble |

## Confidentialité des données

Vos données restent sur votre appareil. Aucune information n''est envoyée à nos serveurs. Les données sont sauvegardées localement dans votre navigateur.

---

**[Accéder au simulateur de vote](/outils/simulateur-vote)**

*Cet outil est fourni à titre indicatif et ne constitue pas un conseil juridique.*',
  'guides',
  'tutoriel',
  'published',
  5,
  ARRAY['simulateur', 'vote', 'AG', 'copropriété', 'majorités', 'tantièmes'],
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Article 2 : Comprendre les majorités en copropriété (lié au simulateur)
INSERT INTO articles (
  slug,
  title,
  seo_title,
  excerpt,
  meta_description,
  content,
  category,
  type,
  status,
  reading_time_minutes,
  tags,
  published_at
) VALUES (
  'majorites-vote-copropriete-article-24-25-26',
  'Les majorités de vote en copropriété : article 24, 25, 26 et unanimité',
  'Majorités en copropriété : article 24, 25, 26 expliqués | Beamô',
  'Tout comprendre sur les majorités de vote en assemblée générale de copropriété : article 24, 25, 25-1, 26, 26-1 et unanimité.',
  'Guide complet sur les majorités de vote en copropriété : article 24, 25, 26, unanimité. Comprendre les passerelles et calculer les voix nécessaires.',
  '# Les majorités de vote en copropriété : guide complet

Comprendre les majorités de vote en assemblée générale est essentiel pour tout copropriétaire. Voici un guide complet pour y voir plus clair.

## La majorité simple (Article 24)

La **majorité de l''article 24** est la majorité des voix exprimées des copropriétaires présents ou représentés. Les abstentions ne sont pas comptabilisées.

### Décisions concernées

- Approbation des comptes
- Travaux d''entretien courant
- Remplacement à l''identique d''équipements
- Désignation du syndic (première nomination)

### Calcul

> Votes POUR > 50% des voix exprimées (présents + représentés, hors abstentions)

## La majorité absolue (Article 25)

La **majorité de l''article 25** est la majorité de toutes les voix de l''ensemble des copropriétaires (présents, représentés ET absents).

### Décisions concernées

- Travaux d''économie d''énergie
- Installation de bornes de recharge électrique
- Autorisation de travaux privatifs
- Délégation de pouvoirs au conseil syndical
- Changement de syndic (en cours de mandat)

### Calcul

> Votes POUR > 50% de toutes les voix (présents + représentés + absents)

### Passerelle 25-1

Si la résolution n''est pas adoptée mais obtient **au moins 1/3 des voix**, l''assemblée peut immédiatement procéder à un second vote à la majorité de l''article 24.

## La double majorité (Article 26)

La **majorité de l''article 26** exige une double condition : majorité des copropriétaires ET au moins 2/3 des tantièmes.

### Décisions concernées

- Modification du règlement de copropriété
- Aliénation de parties communes
- Suppression du poste de gardien
- Travaux d''amélioration non visés par l''article 25

### Calcul

> Nombre de copropriétaires POUR > 50% du nombre total de copropriétaires
> ET
> Tantièmes POUR ≥ 2/3 des tantièmes totaux

### Passerelle 26-1

Si la résolution n''est pas adoptée mais obtient **la majorité des voix de l''article 25**, l''assemblée peut convoquer une nouvelle AG dans les 3 mois pour voter à la majorité de l''article 25.

## L''unanimité

L''**unanimité** requiert l''accord de tous les copropriétaires, y compris les absents.

### Décisions concernées

- Changement de destination de l''immeuble
- Aliénation de parties communes nécessaires à la destination
- Modification de la répartition des charges

## Testez vos scénarios de vote

Pour anticiper les résultats de vos votes, utilisez notre **[simulateur de vote en AG](/outils/simulateur-vote)**. Cet outil gratuit calcule automatiquement les majorités et vous indique si vos résolutions peuvent être adoptées.

---

*Ce guide est fourni à titre informatif et ne constitue pas un conseil juridique.*',
  'guides',
  'article',
  'published',
  6,
  ARRAY['majorités', 'article 24', 'article 25', 'article 26', 'unanimité', 'copropriété', 'AG'],
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

