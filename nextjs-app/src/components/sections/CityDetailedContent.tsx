import { Card } from '@/components/ui/card'
import { MapPin, Clock, Shield, Euro, Zap, Users } from 'lucide-react'
import Link from 'next/link'

interface CityDetailedContentProps {
  ville: string
  prep: string
  neighborhoods?: string[]
  citySlug?: string
}

// Contextes locaux spécifiques par ville
const LOCAL_CONTEXTS: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // VILLES PRINCIPALES
  // ═══════════════════════════════════════════════════════════════════════════
  vernon: "Vernon compte 237 copropriétés, un parc très hétérogène où des ensembles neufs modernes côtoient des immeubles anciens chargés d'histoire. Des petites copropriétés de quelques lots comme de plus grandes résidences se partagent le territoire, des bords de Seine jusqu'aux quartiers résidentiels. La proximité avec l'Île-de-France attire de nombreux actifs parisiens cherchant un cadre de vie plus agréable. Le principal défi pour les copropriétaires vernonnais est de trouver un syndic capable de faire intervenir des prestataires de qualité, à la hauteur des exigences de chaque type de bien. Avec 48 copropriétés construites avant 1949 et 39 datant des années 1975-1993, les enjeux de rénovation énergétique sont majeurs.",

  evreux: "Préfecture de l'Eure, Évreux compte 265 copropriétés avec un parc immobilier varié : des résidences récentes du centre-ville aux grands ensembles de La Madeleine et Nétreville. La ville présente un marché de taille intermédiaire en pleine structuration, où les copropriétaires ébroïciens attendent un syndic moderne capable d'accompagner les projets de rénovation énergétique. Les quartiers comme Saint-Michel, Navarre ou le Clos au Duc offrent des typologies très différentes nécessitant une expertise adaptée à chaque contexte.",

  rouen: "Rouen représente le marché le plus dynamique de la copropriété en Normandie, avec 2 782 copropriétés recensées gérant plus de 103 000 lots. Cette concentration fait de la capitale normande un écosystème immobilier unique, où cohabitent immeubles haussmanniens du centre historique et résidences des années 70 de la rive gauche. Contrairement aux idées reçues, près de la moitié des copropriétés rouennaises comptent entre 11 et 50 lots, un segment où Beamô souhaite se développer. Ces structures à taille humaine, souvent négligées par les grands syndics, cumulent les défis : conseils syndicaux actifs cherchant réactivité et transparence, budgets serrés nécessitant une gestion rigoureuse, et enjeux de rénovation énergétique prégnants. Le secteur sauvegardé du centre-ville impose des contraintes architecturales strictes pour toute rénovation. Les copropriétaires rouennais recherchent avant tout un gestionnaire réactif, capable d'intervenir rapidement en cas d'urgence et de communiquer de manière transparente.",

  louviers: "Louviers compte 109 copropriétés, un équilibre parfait entre immeubles anciens du centre historique et résidences récentes vers la gare. La ville, traversée par l'Eure, présente des enjeux spécifiques liés à l'humidité et à l'entretien des bâtiments anciens. Les copropriétés des quartiers Centre-ville, Les Oiseaux et Maison Rouge recherchent un syndic de proximité capable de gérer efficacement les défis quotidiens : entretien des parties communes, rénovation énergétique, et suivi des travaux de ravalement.",

  'les-andelys': "Les Andelys comptent 42 copropriétés, principalement concentrées dans le Grand Andely et le Petit Andely. Cette commune historique dominée par Château-Gaillard présente un charme particulier avec ses petites structures patrimoniales. Les copropriétés andelysiennes, souvent de taille modeste, nécessitent un syndic attentif aux spécificités du bâti ancien et capable de naviguer les contraintes architecturales du centre historique.",

  gaillon: "Gaillon compte 31 copropriétés et bénéficie d'une position stratégique à proximité de l'A13, entre Vernon et Louviers. Le parc immobilier diversifié va des petites copropriétés résidentielles aux ensembles plus importants d'Aubevoye et Saint-Aubin-sur-Gaillon. Les copropriétaires gaillonnais recherchent un syndic réactif capable de gérer efficacement leurs besoins spécifiques tout en optimisant les charges.",

  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTROPOLE DE ROUEN
  // ═══════════════════════════════════════════════════════════════════════════
  'mont-saint-aignan': "Mont-Saint-Aignan compte 82 copropriétés, ce qui en fait la commune la plus importante de la métropole rouennaise après Rouen même. Ville universitaire et résidentielle prisée, elle présente un parc immobilier de qualité avec des résidences des années 60-80 côtoyant des programmes plus récents. Les copropriétaires mont-saint-aignanais, souvent des cadres ou des familles, attendent un niveau de service élevé : réactivité, transparence comptable, et accompagnement sur les projets de rénovation énergétique.",

  darnetal: "Darnétal compte 25 copropriétés, principalement des ensembles construits dans les années 1960-1980. Commune ouvrière historique de la vallée du Robec, elle connaît aujourd'hui un renouveau avec l'arrivée du tramway et de nouveaux programmes immobiliers. Les copropriétés darnétalaises font face à des enjeux de rénovation thermique importants sur un parc vieillissant, nécessitant un syndic capable d'accompagner les dossiers de subventions MaPrimeRénov'.",

  'le-mesnil-esnard': "Le Mesnil-Esnard compte 22 copropriétés dans un cadre résidentiel recherché aux portes de Rouen. Cette commune verdoyante attire des familles et des retraités cherchant calme et qualité de vie. Les copropriétés mesnil-esnardaises, souvent de taille moyenne (10-30 lots), nécessitent un syndic de proximité capable d'assurer un suivi régulier et personnalisé, loin des pratiques des grands groupes nationaux.",

  'saint-etienne-du-rouvray': "Saint-Étienne-du-Rouvray compte 18 copropriétés, principalement issues des grands programmes des années 1960-1970. Deuxième ville de la métropole, elle présente des enjeux sociaux et urbains importants avec plusieurs quartiers en rénovation ANRU. Les copropriétés stéphanaises nécessitent un syndic expert en accompagnement des travaux de réhabilitation et en montage de dossiers de subventions pour les copropriétés fragiles.",

  'notre-dame-de-bondeville': "Notre-Dame-de-Bondeville compte 16 copropriétés dans un cadre résidentiel au nord de Rouen. Commune en développement avec l'arrivée du tramway, elle attire de nouveaux habitants et voit émerger des programmes immobiliers récents. Les copropriétés bondevillaises, mêlant ancien et neuf, recherchent un syndic capable de gérer cette diversité avec professionnalisme.",

  'franqueville-saint-pierre': "Franqueville-Saint-Pierre compte 10 copropriétés dans un environnement résidentiel prisé à l'est de Rouen. Cette commune verdoyante attire des familles aisées cherchant un cadre de vie privilégié tout en restant proche de la métropole. Les copropriétés franquevillaises, souvent de standing, attendent un service premium et une grande réactivité.",

  'saint-leger-du-bourg-denis': "Saint-Léger-du-Bourg-Denis compte 3 copropriétés dans cette petite commune limitrophe de Darnétal. Bien que modeste en nombre, ces copropriétés méritent un accompagnement de qualité. Beamô propose aux copropriétaires saint-légérois le même niveau de service que pour les grandes structures : gestionnaire dédié, extranet accessible, et réactivité garantie.",

  // ═══════════════════════════════════════════════════════════════════════════
  // ZONE VERNON / EURE
  // ═══════════════════════════════════════════════════════════════════════════
  'saint-marcel': "Saint-Marcel compte 42 copropriétés, dont l'une des plus grandes de l'Eure. Cette commune limitrophe de Vernon présente un parc immobilier diversifié, des petites résidences aux grands ensembles. Les copropriétaires saint-marcellois bénéficient de la proximité de Vernon tout en conservant un cadre plus calme. Un syndic local comme Beamô peut intervenir en quelques minutes en cas d'urgence.",

  'pacy-sur-eure': "Pacy-sur-Eure compte 19 copropriétés dans ce bourg dynamique aux portes de l'Île-de-France. La ville attire des actifs franciliens cherchant un meilleur cadre de vie tout en restant connectés à Paris. Les copropriétés pacéennes, souvent de taille modeste, nécessitent un syndic capable d'allier professionnalisme et proximité.",

  gasny: "Gasny compte 6 copropriétés dans cette commune frontalière de l'Île-de-France, à deux pas de Giverny. Le marché immobilier gasnois attire des acquéreurs cherchant les prix normands avec la proximité parisienne. Ces petites copropriétés méritent un accompagnement attentif que seul un syndic local peut offrir.",

  'la-chapelle-longueville': "La Chapelle-Longueville compte 6 copropriétés, un village bi-générationnel où cohabitent résidences anciennes et programmes récents. Située entre Vernon et Gasny, cette commune bénéficie d'un cadre rural préservé. Les copropriétaires chapellois apprécient un syndic de proximité capable d'intervenir rapidement.",

  giverny: "Giverny compte 2 copropriétés dans ce village mondialement connu pour les jardins de Monet. L'immobilier givernois est rare et prisé, avec des biens de caractère nécessitant une attention particulière. Beamô accompagne ces petites structures avec le même professionnalisme que les grands ensembles.",

  bueil: "Bueil compte 2 copropriétés dans ce petit bourg rural de la vallée de l'Eure. Ces structures modestes méritent un syndic attentif capable de gérer les spécificités du bâti ancien et des petites copropriétés où chaque copropriétaire compte.",

  // ═══════════════════════════════════════════════════════════════════════════
  // AXE VERNON - ÉVREUX
  // ═══════════════════════════════════════════════════════════════════════════
  'val-de-reuil': "Val-de-Reuil compte 5 copropriétés dans cette ville nouvelle créée dans les années 1970. Le parc immobilier valdoreuillais présente des spécificités liées à l'urbanisme de l'époque : grands ensembles, équipements collectifs vieillissants, et enjeux de rénovation énergétique majeurs. Les copropriétaires valdoreuillais ont besoin d'un syndic expert en accompagnement des projets de réhabilitation.",

  'le-vaudreuil': "Le Vaudreuil compte 11 copropriétés dans cette commune stratégique au carrefour de l'A13 et de la N154. Zone commerciale dynamique, elle attire des actifs et des jeunes ménages. Les copropriétés valdreuilliennes, souvent récentes, nécessitent un syndic capable d'accompagner les primo-accédants et de gérer les garanties constructeur.",

  etrepagny: "Étrépagny compte 10 copropriétés dans ce bourg-centre du Vexin normand. Chef-lieu de canton, la ville présente un patrimoine architectural intéressant et des copropriétés anciennes nécessitant une expertise en rénovation. Les copropriétaires étrépagniens apprécient un syndic connaissant les spécificités rurales.",

  'ivry-la-bataille': "Ivry-la-Bataille compte 21 copropriétés dans cette commune historique de la vallée de l'Eure. Située sur l'axe Évreux-Dreux, elle présente un parc immobilier patrimonial avec des enjeux de conservation et de rénovation. Les copropriétaires ivryens recherchent un syndic capable de concilier respect du bâti ancien et amélioration énergétique.",

  // ═══════════════════════════════════════════════════════════════════════════
  // COURONNE ÉBROÏCIENNE
  // ═══════════════════════════════════════════════════════════════════════════
  gravigny: "Gravigny compte 16 copropriétés aux portes d'Évreux. Cette commune périurbaine en développement attire des familles cherchant le calme résidentiel tout en restant proches de la préfecture. Les copropriétés gravigniennes mêlent ancien (années 70-80) et programmes neufs, nécessitant un syndic polyvalent.",

  'saint-sebastien-de-morsent': "Saint-Sébastien-de-Morsent compte 4 copropriétés en continuité immédiate d'Évreux. Cette commune résidentielle de 5 000 habitants voit émerger des programmes neufs attirant jeunes ménages et primo-accédants. Les copropriétés morsentiennes, souvent récentes, nécessitent un syndic pédagogue pour accompagner des copropriétaires novices.",

  'saint-andre-de-l-eure': "Saint-André-de-l'Eure compte 8 copropriétés dans ce bourg dynamique à 10 km d'Évreux. La commune attire des actifs cherchant un compromis entre prix accessibles et proximité des services. Les copropriétaires saint-andréens apprécient un syndic local capable d'intervenir rapidement.",

  'le-vieil-evreux': "Le Vieil-Évreux compte 2 copropriétés dans cette commune limitrophe de la préfecture. Site archéologique majeur, elle présente un cadre de vie recherché. Ces petites structures méritent un accompagnement attentif de la part d'un syndic de proximité.",

  'la-couture-boussey': "La Couture-Boussey compte 5 copropriétés dans ce village connu pour sa tradition de facture instrumentale. Située à mi-chemin entre Évreux et Pacy-sur-Eure, la commune offre un cadre rural préservé. Les copropriétaires couturois bénéficient avec Beamô d'un syndic local réactif.",

  'angerville-la-campagne': "Angerville-la-Campagne compte 1 copropriété dans ce petit village de la campagne ébroïcienne. Même pour une structure unique, Beamô propose un accompagnement professionnel avec gestionnaire dédié et réactivité garantie. Les copropriétaires angervillais méritent le même niveau de service que les grandes copropriétés urbaines.",
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
                    <strong className="text-foreground">Nous nous déplaçons chez vous plutôt que de vous faire venir à nos bureaux.</strong> Visites techniques, réunions de conseil syndical, états des lieux : nous nous rendons sur place {prep} {ville} aussi souvent que nécessaire. Un syndic vraiment de proximité.
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
                Nous connaissons les enjeux spécifiques des copropriétés {prep} {ville} : climat normand nécessitant
                un entretien régulier des toitures et façades, problématiques d'isolation thermique des bâtiments anciens,
                et réglementations locales d'urbanisme.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Réactivité garantie
              </h3>
              <p className="text-muted-foreground mb-4">
                Contrairement aux grands groupes nationaux où vos demandes peuvent mettre des semaines avant d'être traitées,
                nous nous engageons à vous répondre sous 48h ouvrées maximum pour toute demande administrative.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong className="text-foreground">Pour les urgences (fuite d'eau, inondation, problème de chauffage, sécurité),
                nous intervenons ou faisons intervenir le bon prestataire dès les premières minutes suivant votre appel.</strong> Nous ne laissons
                jamais une copropriété seule face à une situation critique. Vous avez toujours un interlocuteur joignable.
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
                <strong className="text-foreground">L'un des défis majeurs {prep} {ville} est de faire intervenir des prestataires de qualité, à la hauteur des exigences de chaque copropriété.</strong> Chez Beamô, nous constituons un réseau d'artisans et d'entreprises locales sélectionnées avec soin :
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
              <strong className="text-foreground">Syndic de proximité</strong> : Nous nous déplaçons
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

          <Card className="border-2 border-primary bg-primary/5 p-6 mt-6">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Changement de syndic {prep} {ville} : nous gérons tout de A à Z
            </h3>
            <p className="text-muted-foreground mb-3">
              Vous envisagez de changer de syndic {prep} {ville} ? Vous n'êtes pas seul :
              de nombreuses copropriétés franchissent le pas chaque année pour retrouver
              proximité, réactivité et transparence.
            </p>

            {/* CTA vers article guide - uniquement pour Évreux pour l'instant */}
            {citySlug === 'evreux' && (
              <div className="bg-white border-2 border-black rounded-lg p-5 mb-4">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">📖</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">
                      Guide complet : Changer de syndic à Évreux
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Procédure détaillée, délais réels, spécificités du marché ébroïcien
                      (410 copros, 23 syndics), témoignages et retours d'expérience.
                      <strong className="text-foreground"> Lecture 8 min.</strong>
                    </p>
                    <Link
                      href="/ressources/changer-syndic-copropriete-evreux"
                      className="inline-block bg-primary text-black font-semibold px-5 py-2 rounded-lg hover:bg-primary/90 transition text-sm"
                    >
                      Lire le guide complet →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Aucun frais de changement</strong> :
              La transition est gratuite et sécurisée, conformément à la réglementation.
            </p>
          </Card>
        </div>
      </section>
    </>
  )
}
