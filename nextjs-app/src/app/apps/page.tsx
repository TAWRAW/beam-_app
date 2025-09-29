/**
 * DASHBOARD ADMINISTRATION - Page d'accueil
 *
 * Point d'entrée principal de l'interface d'administration Beamô.
 * Accessible uniquement après authentification (protégé par middleware).
 *
 * FONCTIONNALITÉS:
 * - Page d'accueil du dashboard admin
 * - Navigation vers les différents modules (sidebar)
 * - Vue d'ensemble des statistiques (à implémenter)
 *
 * ÉVOLUTION PRÉVUE:
 * - Widgets de statistiques (articles, mandats, utilisateurs)
 * - Graphiques de performance
 * - Notifications et alertes
 * - Raccourcis vers actions fréquentes
 *
 * MAINTENANCE:
 * - Protégé par middleware.ts (vérification auth)
 * - Layout commun dans /apps/layout.tsx (sidebar + header)
 * - Ajouter des composants widgets pour enrichir le dashboard
 */

export default function AppsHome() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Tableau de bord</h1>
      <p className="text-sm text-gray-700">Bienvenue dans l'espace Applications.</p>

      {/* TODO: Ajouter des widgets de statistiques */}
      {/* TODO: Graphiques de performance */}
      {/* TODO: Notifications et raccourcis */}
    </div>
  )
}

