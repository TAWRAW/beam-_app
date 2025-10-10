import { Card } from '@/components/ui/card'
import { MapPin, Clock, Shield, Euro, Zap, Users } from 'lucide-react'

interface CityDetailedContentProps {
  ville: string
  prep: string
  neighborhoods?: string[]
  citySlug?: string
}

// Contextes locaux spécifiques par ville
const LOCAL_CONTEXTS: Record<string, string> = {
  vernon: "Vernon compte des copropriétés très hétérogènes : des ensembles neufs modernes côtoient des immeubles anciens chargés d'histoire, des petites copropriétés de quelques lots comme de plus grandes résidences. Le principal défi pour les copropriétaires vernonnais est de trouver un syndic capable de faire intervenir des prestataires de qualité, à la hauteur des exigences de chaque type de bien.",
  gaillon: "Gaillon bénéficie d'une position stratégique à proximité de l'A13, avec un parc immobilier diversifié allant des petites copropriétés résidentielles aux ensembles plus importants. Les copropriétaires recherchent un syndic réactif capable de gérer efficacement leurs besoins spécifiques.",
  evreux: "Préfecture de l'Eure, Évreux dispose d'un parc de copropriétés varié, des résidences récentes du centre-ville aux grands ensembles de La Madeleine et Nétreville. Les copropriétaires ébroïciens attendent un syndic moderne capable d'accompagner les projets de rénovation énergétique.",
}

export default function CityDetailedContent({ ville, prep, neighborhoods, citySlug }: CityDetailedContentProps) {
  const localContext = citySlug ? LOCAL_CONTEXTS[citySlug] : null

  return (
    <>
      {/* Contexte local spécifique */}
      {localContext && (
        <section className="section bg-muted">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Le marché de la copropriété {prep} {ville}
            </h2>
            <Card className="border-2 border-black bg-white p-6">
              <p className="text-muted-foreground text-lg leading-relaxed">
                {localContext}
              </p>
            </Card>
          </div>
        </section>
      )}

      {/* Spécialisation Beamô petites copropriétés */}
      <section className="section">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Beamô, spécialiste des petites copropriétés {prep} {ville}
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-2 border-black bg-primary/10 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary rounded-full">
                  <Users className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Expertise petites copropriétés
                  </h3>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Beamô est spécialisé dans la gestion des petites et moyennes copropriétés de moins de 50 lots principaux.</strong> Cette spécialisation nous permet d'offrir un service sur-mesure, adapté aux besoins réels de votre immeuble, sans les lourdeurs administratives des grands groupes nationaux.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-2 border-black bg-primary/10 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary rounded-full">
                  <Zap className="h-6 w-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Flexibilité et déplacements
                  </h3>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Nous nous déplaçons chez vous plutôt que de vous faire venir à nos bureaux.</strong> Visites techniques, réunions de conseil syndical, états des lieux : notre équipe se rend sur place {prep} {ville} aussi souvent que nécessaire. Un syndic vraiment de proximité.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <p className="text-muted-foreground mb-6">
            Notre modèle économique est pensé pour les copropriétés de taille humaine : nous maximisons le temps passé auprès des conseils syndicaux et des copropriétaires, grâce à l'adoption d'outils digitaux performants qui simplifient la gestion administrative. <strong className="text-foreground">Plus de temps pour vous accompagner, moins de temps perdu derrière un écran.</strong>
          </p>
        </div>
      </section>

      {/* Pourquoi choisir un syndic local */}
      <section className="section bg-muted">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Pourquoi choisir un syndic local {prep} {ville} ?
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Proximité et connaissance du terrain
              </h3>
              <p className="text-muted-foreground mb-4">
                En tant que syndic basé en Normandie, nous connaissons parfaitement {ville} et ses spécificités locales.
                Cette proximité nous permet d'intervenir rapidement en cas d'urgence et de travailler avec un réseau
                de prestataires de confiance implantés localement.
              </p>
              <p className="text-muted-foreground">
                Notre équipe connaît les enjeux spécifiques des copropriétés {prep} {ville} : climat normand nécessitant
                un entretien régulier des toitures et façades, problématiques d'isolation thermique des bâtiments anciens,
                et réglementations locales d'urbanisme.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Réactivité garantie 48h
              </h3>
              <p className="text-muted-foreground mb-4">
                Contrairement aux grands groupes nationaux où vos demandes peuvent mettre des semaines avant d'être traitées,
                nous nous engageons à vous répondre sous 48h ouvrées maximum. Fuite d'eau, problème de chauffage collectif,
                ou simple question administrative : vous avez toujours un interlocuteur disponible.
              </p>
              <p className="text-muted-foreground">
                Chaque copropriété dispose d'un gestionnaire dédié qui connaît votre immeuble et son historique.
                Terminées les explications répétitives à chaque appel : votre interlocuteur vous connaît et comprend
                immédiatement le contexte de votre demande.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Transparence totale
              </h3>
              <p className="text-muted-foreground mb-4">
                Nous mettons à votre disposition un extranet moderne où vous pouvez consulter 24h/24 tous les documents
                de votre copropriété : procès-verbaux d'assemblée générale, contrats de maintenance, factures, et
                suivi en temps réel des interventions en cours.
              </p>
              <p className="text-muted-foreground">
                Chaque dépense est justifiée et tracée. Notre tableau de bord vous permet de suivre l'évolution
                des charges, de comprendre leur répartition, et d'anticiper les budgets futurs. Pas de mauvaises
                surprises : vous gardez le contrôle.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                Tarifs clairs et compétitifs
              </h3>
              <p className="text-muted-foreground mb-4">
                Nos honoraires sont fixes et connus dès le départ : pas de frais cachés, pas de surfacturation
                pour des prestations qui devraient être incluses. Chaque prestation exceptionnelle est validée
                en assemblée générale avant réalisation.
              </p>
              <p className="text-muted-foreground">
                Grâce à notre taille humaine et à notre réseau local, nous négocions des tarifs avantageux avec
                nos prestataires (plombiers, électriciens, jardiniers) que nous vous faisons bénéficier. Un syndic
                local, c'est aussi des économies substantielles sur vos charges.
              </p>
            </div>
          </div>

          <Card className="border-2 border-black bg-primary/10 p-6">
            <p className="text-foreground font-medium text-center">
              Un syndic {prep} {ville}, c'est l'assurance d'un service de proximité, réactif et transparent,
              au service exclusif de votre copropriété. Contactez-nous pour un devis gratuit et sans engagement.
            </p>
          </Card>
        </div>
      </section>

      {/* Quartiers couverts */}
      {neighborhoods && neighborhoods.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Quartiers de {ville} couverts par Beamô
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Notre syndic intervient dans tous les quartiers de {ville} et ses environs proches.
              Quelle que soit la localisation de votre copropriété, nous assurons une présence régulière
              et une réactivité optimale.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {neighborhoods.map((neighborhood) => (
                <Card key={neighborhood} className="border-2 border-black bg-white p-4 text-center">
                  <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="font-medium text-foreground">{neighborhood}</p>
                </Card>
              ))}
            </div>

            <Card className="border-2 border-black bg-primary/10 p-6 mb-6">
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Réseau de prestataires qualifiés {prep} {ville}
              </h3>
              <p className="text-muted-foreground mb-3">
                <strong className="text-foreground">L'un des défis majeurs {prep} {ville} est de faire intervenir des prestataires de qualité, à la hauteur des exigences de chaque copropriété.</strong> Chez Beamô, nous avons constitué au fil des années un réseau d'artisans et d'entreprises locales sélectionnées avec soin :
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Plombiers et chauffagistes</strong> réactifs pour les urgences et l'entretien des chaudières collectives</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Électriciens agréés</strong> pour la mise aux normes et le dépannage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Entreprises de ravalement</strong> spécialisées dans le patrimoine ancien comme dans les constructions récentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Jardiniers et paysagistes</strong> pour l'entretien des espaces verts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong className="text-foreground">Entreprises de nettoyage</strong> de confiance pour les parties communes</span>
                </li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Tous nos prestataires sont systématiquement mis en concurrence pour garantir le meilleur rapport qualité-prix à votre copropriété. Chaque devis est présenté au conseil syndical pour validation avant engagement.
              </p>
            </Card>

            <p className="text-muted-foreground">
              <strong className="text-foreground">Syndic de proximité</strong> : Nos gestionnaires se déplacent
              régulièrement dans votre copropriété pour les visites techniques, les états des lieux, et le suivi
              des travaux. La proximité géographique nous permet d'être présents quand vous en avez besoin, sans
              délai d'intervention excessif comme avec les syndics parisiens ou nationaux.
            </p>

            <p className="text-muted-foreground mt-4">
              Vous êtes situés dans une commune limitrophe de {ville} ? Contactez-nous ! Nous couvrons également
              l'ensemble de l'agglomération et les villes voisines avec le même niveau de service.
            </p>
          </div>
        </section>
      )}

      {/* Services détaillés */}
      <section className="section">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Nos services de syndic {prep} {ville}
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 border-black bg-white p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Gestion administrative
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Tenue de la comptabilité de copropriété</li>
                <li>• Préparation et organisation des AG</li>
                <li>• Rédaction des procès-verbaux</li>
                <li>• Suivi des impayés et recouvrement</li>
                <li>• Mise à jour du registre d'immatriculation</li>
                <li>• Gestion des contrats d'assurance</li>
              </ul>
            </Card>

            <Card className="border-2 border-black bg-white p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Gestion technique
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Suivi des contrats de maintenance</li>
                <li>• Organisation des travaux votés en AG</li>
                <li>• Recherche et mise en concurrence des prestataires</li>
                <li>• Contrôle de la bonne exécution des interventions</li>
                <li>• Gestion des urgences 24h/24</li>
                <li>• Diagnostics techniques réglementaires</li>
              </ul>
            </Card>

            <Card className="border-2 border-black bg-white p-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Accompagnement conseil
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Conseil sur les projets de rénovation</li>
                <li>• Aide aux demandes de subventions (ANAH, CEE)</li>
                <li>• Optimisation énergétique des bâtiments</li>
                <li>• Support juridique et réglementaire</li>
                <li>• Formation du conseil syndical</li>
                <li>• Plan pluriannuel de travaux (PPT)</li>
              </ul>
            </Card>
          </div>

          <Card className="border-2 border-black bg-white p-6 mt-6">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Changement de syndic {prep} {ville} : nous nous occupons de tout
            </h3>
            <p className="text-muted-foreground mb-3">
              Vous souhaitez changer de syndic pour Beamô ? Le processus est simple et nous vous accompagnons
              à chaque étape :
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-3">
              <li>
                <strong className="text-foreground">Audit gratuit</strong> : Nous analysons votre situation
                actuelle et vous proposons un devis détaillé
              </li>
              <li>
                <strong className="text-foreground">Préparation de l'AG</strong> : Nous rédigeons la résolution
                de changement de syndic conforme à la loi Alur
              </li>
              <li>
                <strong className="text-foreground">Vote en assemblée</strong> : Le changement est voté par
                les copropriétaires (majorité simple)
              </li>
              <li>
                <strong className="text-foreground">Transfert des documents</strong> : Nous récupérons tous
                les documents auprès de l'ancien syndic (dossiers, archives, comptabilité)
              </li>
              <li>
                <strong className="text-foreground">Prise en main</strong> : Nous prenons immédiatement le relais
                de la gestion courante sans interruption de service
              </li>
            </ol>
            <p className="text-muted-foreground">
              Aucun frais de changement de syndic ne vous sera facturé. La transition est totalement gratuite
              et sécurisée, conformément à la réglementation en vigueur.
            </p>
          </Card>
        </div>
      </section>
    </>
  )
}
