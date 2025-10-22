import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Conditions d\'utilisation - Beamô',
  description: 'Conditions générales d\'utilisation du site web et des services de Beamô, syndic de copropriété en Normandie.',
  robots: 'index, follow',
  openGraph: {
    title: 'Conditions d\'utilisation - Beamô',
    description: 'Conditions générales d\'utilisation du site web et des services de Beamô, syndic de copropriété en Normandie.',
    url: 'https://xn--beam-yqa.fr/conditions-utilisation',
    type: 'website',
  },
  alternates: {
    canonical: 'https://xn--beam-yqa.fr/conditions-utilisation',
  },
};

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative -mt-20 md:-mt-24 pt-20 md:pt-24 bg-primary">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Conditions d'utilisation
            </h1>
            <p className="text-xl text-muted-foreground">
              Modalités et conditions d'utilisation de nos services
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
              
              <h2>1. Acceptation des conditions</h2>
              <p>
                L'accès et l'utilisation du site web <strong>https://xn--beam-yqa.fr</strong> (ci-après « le Site ») 
                ainsi que des services proposés par <strong>Beamô</strong> impliquent l'acceptation pleine et entière 
                des présentes conditions générales d'utilisation.
              </p>

              <h2>2. Présentation du service</h2>
              <p>
                <strong>Beamô</strong> est un syndic de copropriété professionnel proposant :
              </p>
              <ul>
                <li>Gestion administrative et comptable de copropriétés</li>
                <li>Conseil et accompagnement juridique</li>
                <li>Services de maintenance et travaux</li>
                <li>Outils numériques pour copropriétaires</li>
              </ul>

              <h2>3. Accès au site</h2>
              <p>
                Le Site est accessible gratuitement à tout utilisateur ayant un accès à Internet. 
                Tous les frais supportés par l'utilisateur pour accéder au service (matériel informatique, 
                logiciels, connexion Internet, etc.) sont à sa charge.
              </p>

              <h2>4. Utilisation du site</h2>
              <p>L'utilisateur s'engage à :</p>
              <ul>
                <li>Utiliser le Site conformément à sa destination</li>
                <li>Ne pas perturber le fonctionnement du Site</li>
                <li>Respecter la propriété intellectuelle</li>
                <li>Fournir des informations exactes lors des formulaires</li>
                <li>Ne pas utiliser le Site à des fins illégales ou frauduleuses</li>
              </ul>

              <h2>5. Contenu du site</h2>
              <p>
                Beamô s'efforce de fournir des informations aussi précises que possible. 
                Toutefois, il ne pourra être tenu responsable des omissions, inexactitudes 
                et carences dans la mise à jour, qu'elles soient de son fait ou du fait 
                des tiers partenaires qui lui fournissent ces informations.
              </p>

              <h2>6. Propriété intellectuelle</h2>
              <p>
                Tous les éléments du Site (textes, images, vidéos, logos, etc.) sont 
                protégés par les dispositions du Code de la propriété intellectuelle. 
                Toute reproduction, représentation, modification, publication, adaptation 
                de tout ou partie des éléments du Site est interdite, sauf autorisation écrite préalable.
              </p>

              <h2>7. Données personnelles</h2>
              <p>
                La collecte et le traitement des données personnelles sont régis par notre 
                <a href="/politique-de-confidentialite" className="text-primary hover:underline">
                  Politique de Confidentialité
                </a>. En utilisant le Site, vous acceptez ces conditions de traitement.
              </p>

              <h2>8. Responsabilité</h2>
              <p>
                Beamô ne saurait être tenue responsable de dommages directs et indirects 
                causés au matériel de l'utilisateur, lors de l'accès au Site, et résultant 
                soit de l'utilisation d'un matériel ne répondant pas aux spécifications 
                indiquées, soit de l'apparition d'un bug ou d'une incompatibilité.
              </p>

              <h2>9. Services professionnels</h2>
              <p>
                Les prestations de syndic professionnel sont régies par :
              </p>
              <ul>
                <li>La loi n° 65-557 du 10 juillet 1965</li>
                <li>Le décret n° 67-223 du 17 mars 1967</li>
                <li>La loi ALUR et ses décrets d'application</li>
                <li>Nos conditions générales de prestation spécifiques</li>
              </ul>

              <h2>10. Liens externes</h2>
              <p>
                Le Site peut contenir des liens vers des sites externes. Beamô n'exerce 
                aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
              </p>

              <h2>11. Cookies</h2>
              <p>
                Le Site utilise des cookies pour améliorer l'expérience utilisateur et 
                réaliser des statistiques de visites. L'utilisateur peut paramétrer 
                l'utilisation des cookies depuis son navigateur.
              </p>

              <h2>12. Force majeure</h2>
              <p>
                Beamô ne saurait être tenue responsable de l'inexécution ou des retards 
                dans l'exécution de ses obligations en cas de force majeure ou de cas fortuit.
              </p>

              <h2>13. Modification des conditions</h2>
              <p>
                Beamô se réserve le droit de modifier les présentes conditions à tout moment. 
                Les nouvelles conditions seront applicables dès leur mise en ligne. 
                Il est conseillé de consulter régulièrement cette page.
              </p>

              <h2>14. Droit applicable et juridiction</h2>
              <p>
                Les présentes conditions sont soumises au droit français. 
                En cas de litige, et après recherche d'une solution amiable, 
                les tribunaux français seront seuls compétents.
              </p>

              <h2>15. Contact</h2>
              <p>
                Pour toute question relative aux présentes conditions d'utilisation, 
                vous pouvez nous contacter :
              </p>
              <ul>
                <li><strong>Email :</strong> tom.lemeille@xn--beam-yqa.fr</li>
                <li><strong>Téléphone :</strong> 07 75 70 70 99</li>
                <li><strong>Adresse :</strong> 27950 Saint-Marcel</li>
              </ul>

              <p className="text-sm text-muted-foreground mt-8">
                <strong>Dernière mise à jour :</strong> 22 septembre 2025
              </p>

              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}