import { Metadata } from 'next';

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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative -mt-20 md:-mt-24 pt-20 md:pt-24 bg-primary">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Mentions légales
            </h1>
            <p className="text-xl text-gray-700">
              Informations légales et réglementaires
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              
              <h2>1. Identification de l'éditeur</h2>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <p><strong>Dénomination :</strong> Beamô</p>
                <p><strong>Forme juridique :</strong> Entreprise individuelle</p>
                <p><strong>Dirigeant :</strong> Tom Lemeille</p>
                <p><strong>Adresse :</strong> 27950 Saint-Marcel, France</p>
                <p><strong>Téléphone :</strong> 07 75 70 70 99</p>
                <p><strong>Email :</strong> tom.lemeille@xn--beam-yqa.fr</p>
              </div>

              <h2>2. Activité professionnelle</h2>
              <p>
                <strong>Beamô</strong> exerce l'activité de syndic de copropriété professionnel, 
                réglementée par :
              </p>
              <ul>
                <li>La loi n° 65-557 du 10 juillet 1965 fixant le statut de la copropriété des immeubles bâtis</li>
                <li>Le décret n° 67-223 du 17 mars 1967 pris pour l'application de la loi du 10 juillet 1965</li>
                <li>La loi n° 70-9 du 2 janvier 1970 réglementant les conditions d'exercice des activités relatives à certaines opérations portant sur les immeubles et les fonds de commerce</li>
                <li>Les dispositions de la loi ALUR (Accès au Logement et Urbanisme Rénové)</li>
              </ul>

              <h2>3. Assurances et garanties</h2>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <p><strong>Responsabilité Civile Professionnelle :</strong></p>
                <p>Compagnie : [À compléter]</p>
                <p>Police n° : [À compléter]</p>
                <p>Garantie territoriale : France</p>
                
                <p className="mt-4"><strong>Garantie Financière :</strong></p>
                <p>Établissement : [À compléter]</p>
                <p>Montant : Conforme à la réglementation en vigueur</p>
              </div>

              <h2>4. Hébergement du site</h2>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <p><strong>Hébergeur :</strong> Vercel Inc.</p>
                <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</p>
                <p><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://vercel.com</a></p>
              </div>

              <h2>5. Directeur de publication</h2>
              <p>
                Le directeur de la publication est <strong>Tom Lemeille</strong>, 
                en qualité de dirigeant de Beamô.
              </p>

              <h2>6. Conception et développement</h2>
              <p>
                Site web conçu et développé par Tom Lemeille pour Beamô.
              </p>

              <h2>7. Propriété intellectuelle</h2>
              <p>
                Le site web <strong>https://xn--beam-yqa.fr</strong> et l'ensemble de son contenu 
                (textes, images, vidéos, logos, structure, charte graphique, etc.) sont la propriété 
                exclusive de Beamô, sauf mentions contraires.
              </p>
              <p>
                La marque « Beamô » et le nom de domaine « xn--beam-yqa.fr » sont la propriété de Beamô.
              </p>

              <h2>8. Crédits</h2>
              <p>Technologies utilisées :</p>
              <ul>
                <li><strong>Framework :</strong> Next.js (React)</li>
                <li><strong>Styling :</strong> Tailwind CSS</li>
                <li><strong>Hébergement :</strong> Vercel</li>
                <li><strong>Domaine :</strong> Registrar OVH</li>
              </ul>

              <h2>9. Données personnelles</h2>
              <p>
                Le traitement des données personnelles collectées sur ce site fait l'objet 
                d'une information détaillée dans notre 
                <a href="/politique-de-confidentialite" className="text-primary hover:underline">
                  Politique de Confidentialité
                </a>.
              </p>

              <h2>10. Cookies</h2>
              <p>
                Ce site utilise des cookies pour améliorer l'expérience utilisateur et 
                réaliser des statistiques de navigation. Vous pouvez paramétrer l'utilisation 
                des cookies dans votre navigateur.
              </p>

              <h2>11. Droit applicable</h2>
              <p>
                Les présentes mentions légales sont régies par le droit français. 
                Le site est conforme aux dispositions de :
              </p>
              <ul>
                <li>La loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique</li>
                <li>Le Règlement Général sur la Protection des Données (RGPD)</li>
                <li>La loi Informatique et Libertés du 6 janvier 1978 modifiée</li>
              </ul>

              <h2>12. Médiation</h2>
              <p>
                En qualité de syndic professionnel, Beamô adhère au dispositif de médiation 
                de la consommation. En cas de litige, vous pouvez saisir le médiateur compétent :
              </p>
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                <p><strong>Médiateur :</strong> [À compléter selon l'organisme choisi]</p>
                <p><strong>Site web :</strong> [À compléter]</p>
              </div>

              <h2>13. Contact</h2>
              <p>
                Pour toute question concernant ces mentions légales ou le fonctionnement du site :
              </p>
              <ul>
                <li><strong>Email :</strong> tom.lemeille@xn--beam-yqa.fr</li>
                <li><strong>Téléphone :</strong> 07 75 70 70 99</li>
                <li><strong>Courrier :</strong> Beamô, 27950 Saint-Marcel, France</li>
              </ul>

              <p className="text-sm text-gray-600 mt-8">
                <strong>Dernière mise à jour :</strong> 22 septembre 2025
              </p>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}