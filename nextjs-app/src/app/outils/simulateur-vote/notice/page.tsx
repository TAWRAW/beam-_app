import { Metadata } from 'next'
import Link from 'next/link'
import { Route } from 'next'
import { ArrowLeft, Building2, Users, Vote, Info, AlertTriangle, Download, Upload, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { HELP_LINKS } from '@/lib/simulateur-vote/constants'

export const metadata: Metadata = {
  title: "Notice d'utilisation — Simulateur de Vote en AG",
  description:
    'Guide complet pour utiliser le simulateur de vote en assemblée générale de copropriété. Apprenez à configurer vos lots, simuler une AG et calculer les majorités.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function NoticePage() {
  return (
    <main className="section">
      <div className="container max-w-4xl">
        <Breadcrumbs
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Outils', href: '/outils' as Route },
            { label: 'Simulateur de vote', href: '/outils/simulateur-vote' as Route },
            { label: 'Notice' },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="h1">Notice d'utilisation</h1>
          <p className="mt-2 text-muted-foreground">
            Comment utiliser le simulateur de vote en AG
          </p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <section>
            <p className="text-lg text-muted-foreground">
              Ce simulateur vous permet de préparer votre assemblée générale de copropriété
              en anticipant les résultats des votes. Il calcule automatiquement les majorités
              requises (articles 24, 25, 26 et unanimité) et vous indique si une résolution
              sera adoptée ou rejetée.
            </p>
          </section>

          {/* Étape 1 : Ma copropriété */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <Building2 className="h-5 w-5" />
                Ma copropriété
              </CardTitle>
              <CardDescription>
                Configurez la structure de votre copropriété
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Ajouter des lots</h4>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur <strong>« Ajouter un lot »</strong> pour créer chaque lot de votre copropriété.
                  Pour chaque lot, renseignez :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li><strong>Numéro de lot</strong> : le numéro ou la référence du lot (obligatoire)</li>
                  <li><strong>Nom du propriétaire</strong> : pour faciliter l'identification (facultatif)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Clés de répartition
                </h4>
                <p className="text-sm text-muted-foreground">
                  Une clé de charges « Charges générales » est créée par défaut. Vous pouvez ajouter
                  jusqu'à 10 clés différentes pour gérer des répartitions spécifiques (Bâtiment A,
                  Ascenseur, Chauffage, etc.).
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Cliquez sur <strong>« + Clé »</strong> dans l'en-tête du tableau pour ajouter une clé</li>
                  <li>Cliquez sur le nom d'une clé pour la renommer</li>
                  <li>Chaque lot peut avoir des tantièmes différents selon la clé</li>
                </ul>

                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-medium text-primary hover:underline">
                    Où trouver les clés de charges dans votre règlement de copropriété ?
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-lg space-y-3">
                    <p className="text-muted-foreground">
                      Dans un règlement de copropriété, la répartition des clés de charges se trouve dans
                      les clauses qui fixent les quotes-parts de chaque lot dans les différentes catégories
                      de charges (générales et spéciales).
                    </p>

                    <div>
                      <p className="font-medium mb-1">Où regarder :</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Partie « répartition des charges » ou « charges communes générales / spéciales »</li>
                        <li>Tableau des tantièmes / millièmes (souvent en annexe)</li>
                        <li>Article reprenant l'article 10 de la loi de 1965</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium mb-1">Types de clés :</p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li><strong>Charges générales</strong> : basées sur la valeur relative de chaque lot
                        (assurance, syndic, entretien parties communes…)</li>
                        <li><strong>Charges spéciales</strong> : clés distinctes selon l'utilité de l'équipement
                        (ascenseur, chauffage collectif, parkings, escalier, bâtiment…)</li>
                      </ul>
                    </div>

                    <p className="text-xs text-muted-foreground italic">
                      Astuce : cherchez dans la table des matières les mots « charges », « répartition »,
                      « tantièmes », « millièmes » ou « tableau de répartition ».
                    </p>
                  </div>
                </details>
              </div>

              <div>
                <h4 className="font-medium mb-2">Saisir les tantièmes</h4>
                <p className="text-sm text-muted-foreground">
                  Dans le tableau, saisissez directement les tantièmes de chaque lot pour chaque clé.
                  Le total des tantièmes par clé est affiché en haut de chaque colonne.
                </p>
                <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">
                    Les tantièmes figurent dans le règlement de copropriété ou l'état descriptif de division.
                    Le total est généralement de 1 000 ou 10 000.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <Upload className="h-4 w-4" />
                  Import / Export
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Plusieurs options pour gérer vos données :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li><strong>Modèle</strong> : téléchargez un fichier CSV à remplir dans Excel, puis importez-le</li>
                  <li><strong>Importer</strong> : chargez un fichier CSV (depuis Excel) ou JSON (export précédent)</li>
                  <li><strong>Exporter</strong> : sauvegardez votre configuration complète en JSON</li>
                </ul>
                <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">
                    Le modèle CSV utilise le point-virgule (;) comme séparateur pour une compatibilité
                    optimale avec Excel français.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Étape 2 : Simuler une AG */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <Users className="h-5 w-5" />
                Simuler une AG
              </CardTitle>
              <CardDescription>
                Définissez les présences à l'assemblée générale
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Statut de présence</h4>
                <p className="text-sm text-muted-foreground">
                  Pour chaque lot, indiquez son statut :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li><strong>Présent</strong> : le copropriétaire assiste à l'AG (physiquement ou à distance)</li>
                  <li><strong>Représenté</strong> : le copropriétaire a donné pouvoir à un autre copropriétaire</li>
                  <li><strong>Absent</strong> : le copropriétaire ne participe pas et n'a pas donné de pouvoir</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Représentation (pouvoirs)</h4>
                <p className="text-sm text-muted-foreground">
                  Si un lot est « Représenté », choisissez le lot présent qui le représente.
                  Un copropriétaire présent peut représenter plusieurs lots.
                </p>
                <div className="flex items-start gap-2 mt-2 p-3 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-orange-800">
                    La loi limite le nombre de mandats : un copropriétaire ne peut généralement pas
                    détenir plus de 3 mandats ou représenter plus de 10% des voix totales.
                    Un avertissement s'affiche si cette limite est dépassée.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Clé de répartition</h4>
                <p className="text-sm text-muted-foreground">
                  Si vous avez plusieurs clés de charges, sélectionnez celle applicable à la résolution
                  que vous souhaitez voter. Les statistiques de présence seront calculées selon cette clé.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Tableau de bord</h4>
                <p className="text-sm text-muted-foreground">
                  En bas de l'écran, le tableau de bord vous montre les majorités atteignables
                  en fonction des présences. Il indique pour chaque type de majorité si le
                  quorum est atteint et le nombre de voix nécessaires.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Étape 3 : Simuler un vote */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </div>
                <Vote className="h-5 w-5" />
                Simuler un vote
              </CardTitle>
              <CardDescription>
                Testez différents scénarios de vote
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Choisir la majorité requise</h4>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez le type de majorité applicable à la résolution que vous souhaitez tester :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li><strong>Article 24</strong> : majorité des voix exprimées (abstentions non comptées)</li>
                  <li><strong>Article 25</strong> : majorité de toutes les voix (présents + absents)</li>
                  <li><strong>Article 26</strong> : majorité des copropriétaires ET 2/3 des tantièmes</li>
                  <li><strong>Unanimité</strong> : accord de tous les copropriétaires</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <Link
                    href={HELP_LINKS.majorites}
                    className="text-primary hover:underline"
                    target="_blank"
                  >
                    En savoir plus sur les majorités en copropriété →
                  </Link>
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Indiquer les votes</h4>
                <p className="text-sm text-muted-foreground">
                  Pour chaque copropriétaire présent (ou représentant), indiquez son vote :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li><strong>Pour</strong> : vote en faveur de la résolution</li>
                  <li><strong>Contre</strong> : vote contre la résolution</li>
                  <li><strong>Abstention</strong> : ne se prononce pas</li>
                </ul>
                <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">
                    Le vote d'un représentant compte pour lui et pour tous les lots qu'il représente.
                    Les tantièmes sont automatiquement cumulés.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Résultat du vote</h4>
                <p className="text-sm text-muted-foreground">
                  Le résultat s'affiche en temps réel avec :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Le statut de la résolution (adoptée ou rejetée)</li>
                  <li>Le décompte détaillé des voix</li>
                  <li>Les passerelles applicables (articles 25-1 et 26-1) si la résolution est rejetée
                  mais pourrait être adoptée avec une majorité moins exigeante</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Informations complémentaires */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informations importantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Confidentialité</h4>
                <p className="text-sm text-muted-foreground">
                  Vos données restent sur votre appareil. Aucune information n'est envoyée à nos serveurs.
                  Les données sont sauvegardées dans le stockage local de votre navigateur.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Réduction des voix (Article 22)</h4>
                <p className="text-sm text-muted-foreground">
                  Si un copropriétaire détient plus de 50% des tantièmes, ses voix sont automatiquement
                  réduites à la somme des voix de tous les autres copropriétaires. Cette règle est
                  appliquée automatiquement par le simulateur.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Avertissement</h4>
                <p className="text-sm text-muted-foreground">
                  Ce simulateur est fourni à titre indicatif et ne constitue pas un conseil juridique.
                  Pour toute question relative aux règles de vote en copropriété, consultez un
                  professionnel du droit immobilier.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA Retour */}
          <div className="flex justify-center pt-4">
            <Link href={'/outils/simulateur-vote' as Route}>
              <Button size="lg" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour au simulateur
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
