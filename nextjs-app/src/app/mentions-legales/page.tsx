import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Mentions légales - Beamô',
  description: 'Mentions légales du site web de Beamô, syndic de copropriété en Normandie. Informations sur l\'éditeur et l\'hébergeur.',
  robots: 'index, follow',
  openGraph: {
    title: 'Mentions légales - Beamô',
    description: 'Mentions légales du site web de Beamô, syndic de copropriété en Normandie. Informations sur l\'éditeur et l\'hébergeur.',
    url: 'https://xn--beam-yqa.fr/mentions-legales',
    type: 'website',
  },
  alternates: {
    canonical: 'https://xn--beam-yqa.fr/mentions-legales',
  },
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative -mt-20 md:-mt-24 pt-20 md:pt-24 bg-primary">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Mentions légales
            </h1>
            <p className="text-xl text-muted-foreground">
              Informations légales et réglementaires
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <Card>
              <CardContent className="p-8">
              
              <h2>1. Identification de l'éditeur</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p><strong>Dénomination sociale :</strong> SASU BEAMO IMMOBILIER</p>
                <p><strong>Nom commercial :</strong> Beamô</p>
                <p><strong>Forme juridique :</strong> Société par Actions Simplifiée Unipersonnelle (SASU)</p>
                <p><strong>Capital social :</strong> 2 500 €</p>
                <p><strong>SIREN :</strong> 989 101 829 Évreux</p>
                <p><strong>Président :</strong> Tom LEMEILLE - Gestionnaire de Copropriétés</p>
                <p><strong>Siège social :</strong> 8 rue du général Leclerc, 27950 Saint-Marcel</p>
                <p><strong>Cabinet :</strong> La Manufacture des Capucins, 2 Place Jean Paul II, 27200 Vernon</p>
                <p><strong>Téléphone :</strong> 07 75 70 70 99</p>
                <p><strong>Email :</strong> bonjour@beamo-copro.fr</p>
                <p><strong>Site web :</strong> www.beamô.fr</p>
              </div>

              <div className="bg-primary/10 border-l-4 border-primary p-4 mb-6">
                <p className="text-sm text-foreground">
                  ℹ️ <strong>Note technique - Nom de domaine et adresse mail :</strong> Certains navigateurs affichent notre nom de domaine et notre adresse e-mail sous la forme xn--beam--yqa.fr / @xn--beam--yqa.fr au lieu de beamô.fr / @beamô.fr.
                  Il s'agit d'un affichage technique lié aux noms de domaine internationalisés (IDN). Vous pouvez nous contacter en toute confiance.
                </p>
              </div>

              <h2>2. Activité professionnelle</h2>
              <p>
                <strong>Beamô</strong> exerce l'activité de syndic de copropriété professionnel,
                réglementée par :
              </p>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <ul className="ml-4">
                  <li>La loi n° 65-557 du 10 juillet 1965 fixant le statut de la copropriété des immeubles bâtis</li>
                  <li>Le décret n° 67-223 du 17 mars 1967 pris pour l'application de la loi du 10 juillet 1965</li>
                  <li>La loi n° 70-9 du 2 janvier 1970 réglementant les conditions d'exercice des activités relatives à certaines opérations portant sur les immeubles et les fonds de commerce</li>
                  <li>Les dispositions de la loi ALUR (Accès au Logement et Urbanisme Rénové)</li>
                </ul>
              </div>

              <div className="bg-muted p-6 rounded-lg mb-6">
                <p><strong>Carte professionnelle :</strong> CPI27012025000000013</p>
                <p><strong>Mention :</strong> Syndic de Copropriété</p>
                <p><strong>Délivrée par :</strong> CCI PORTE DE NORMANDIE (27)</p>
                <p><strong>Conformément à :</strong> Loi n° 70-9 du 02/01/1970</p>
              </div>

              <h2>3. Assurances et garanties</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p><strong>Responsabilité Civile Professionnelle :</strong></p>
                <p>Compagnie : ALLIANZ</p>
                <p>Contact : M. RAYEUR Guillaume</p>
                <p>Adresse : 4 rue Carnot, 27200 Vernon</p>
                <p>Garantie territoriale : France</p>

                <p className="mt-4"><strong>Garantie Financière :</strong></p>
                <p>Établissement : SO.CA.F (Société de Caution Financière)</p>
                <p>Adresse : 26 avenue de Suffren, 75015 Paris</p>
                <p>Montant : 30 000 €</p>
              </div>

              <h2>4. Hébergement du site</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p><strong>Hébergeur :</strong> Vercel Inc.</p>
                <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
                <p><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://vercel.com</a></p>
              </div>

              <h2>5. Directeur de publication</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p>
                  Le directeur de la publication est <strong>Tom Lemeille</strong>,
                  en qualité de dirigeant de Beamô.
                </p>
              </div>

              <h2>6. Conception et développement</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p>
                  Site web conçu et développé par <strong>Tom Lemeille</strong> pour Beamô.
                </p>
              </div>

              <h2>7. Propriété intellectuelle</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p>
                  Le site web <strong>https://xn--beam-yqa.fr</strong> et l'ensemble de son contenu
                  (textes, images, vidéos, logos, structure, charte graphique, etc.) sont la propriété
                  exclusive de Beamô, sauf mentions contraires.
                </p>
                <p className="mt-3">
                  La marque « Beamô » et le nom de domaine « xn--beam-yqa.fr » sont la propriété de Beamô.
                </p>
              </div>

              <h2>8. Crédits</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p className="mb-3">Technologies utilisées :</p>
                <ul className="ml-4">
                  <li><strong>Framework :</strong> Next.js (React)</li>
                  <li><strong>Styling :</strong> Tailwind CSS</li>
                  <li><strong>Hébergement :</strong> Vercel</li>
                  <li><strong>Domaine :</strong> Registrar OVH</li>
                </ul>
              </div>

              <h2>9. Données personnelles</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p>
                  Le traitement des données personnelles collectées sur ce site fait l'objet
                  d'une information détaillée dans notre
                  <a href="/politique-de-confidentialite" className="text-primary hover:underline ml-1">
                    Politique de Confidentialité
                  </a>.
                </p>
              </div>

              <h2>10. Cookies</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p>
                  Ce site utilise des cookies pour améliorer l'expérience utilisateur et
                  réaliser des statistiques de navigation. Vous pouvez paramétrer l'utilisation
                  des cookies dans votre navigateur.
                </p>
              </div>

              <h2>11. Droit applicable</h2>
              <p>
                Les présentes mentions légales sont régies par le droit français.
                Le site est conforme aux dispositions de :
              </p>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <ul className="ml-4">
                  <li>La loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique</li>
                  <li>Le Règlement Général sur la Protection des Données (RGPD)</li>
                  <li>La loi Informatique et Libertés du 6 janvier 1978 modifiée</li>
                </ul>
              </div>

              <h2>12. Médiation de la consommation</h2>
              <p>
                Conformément à l'article R 616-1 du Code de la Consommation, Beamô informe
                les consommateurs de l'existence d'un médiateur de la consommation.
              </p>
              <p>
                En cas de litige, vous pouvez saisir gratuitement le médiateur compétent :
              </p>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-6">
                <p className="font-semibold text-lg mb-3">IMMOMEDIATEURS</p>
                <p><strong>Adresse :</strong> 55 avenue Marceau, 75116 Paris</p>
                <p><strong>Téléphone :</strong> 01 47 20 73 21</p>
                <p><strong>Site internet :</strong>{' '}
                  <a
                    href="https://conso.immomediateurs.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    conso.immomediateurs.com
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-3">
                  La saisine du médiateur est gratuite et peut intervenir après une tentative
                  de résolution directe auprès de Beamô restée infructueuse.
                </p>
              </div>

              <h2>13. Contact</h2>
              <p>
                Pour toute question concernant ces mentions légales ou le fonctionnement du site :
              </p>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p><strong>Email :</strong> bonjour@beamo-copro.fr</p>
                <p><strong>Téléphone :</strong> 07 75 70 70 99</p>
                <p><strong>Siège social :</strong> 8 rue du général Leclerc, 27950 Saint-Marcel</p>
                <p><strong>Cabinet :</strong> La Manufacture des Capucins, 2 Place Jean Paul II, 27200 Vernon</p>
              </div>

              <p className="text-sm text-muted-foreground mt-8">
                <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>

              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}