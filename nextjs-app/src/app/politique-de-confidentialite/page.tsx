import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - Beamô',
  description: 'Politique de confidentialité et protection des données personnelles de Beamô, syndic de copropriété en Normandie.',
  robots: 'index, follow',
  openGraph: {
    title: 'Politique de Confidentialité - Beamô',
    description: 'Politique de confidentialité et protection des données personnelles de Beamô, syndic de copropriété en Normandie.',
    url: 'https://xn--beam-yqa.fr/politique-de-confidentialite',
    type: 'website',
  },
  alternates: {
    canonical: 'https://xn--beam-yqa.fr/politique-de-confidentialite',
  },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative -mt-20 md:-mt-24 pt-20 md:pt-24 bg-primary">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Politique de Confidentialité
            </h1>
            <p className="text-xl text-muted-foreground">
              Transparence et protection de vos données personnelles
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
              
              <h2>1. Responsable du traitement</h2>
              <p>
                <strong>Beamô</strong><br />
                Représentée par Tom Lemeille<br />
                Email : tom.lemeille@xn--beam-yqa.fr<br />
                Site web : https://xn--beam-yqa.fr
              </p>

              <h2>2. Données collectées</h2>
              <p>Nous collectons les données suivantes :</p>
              <ul>
                <li><strong>Données d'identification :</strong> nom, prénom, email, téléphone</li>
                <li><strong>Données de copropriété :</strong> adresse de l'immeuble, informations sur la copropriété</li>
                <li><strong>Données de navigation :</strong> adresse IP, cookies, pages visitées</li>
                <li><strong>Données de communication :</strong> messages via formulaires de contact</li>
              </ul>

              <h2>3. Finalités du traitement</h2>
              <p>Vos données sont utilisées pour :</p>
              <ul>
                <li>Répondre à vos demandes de contact et devis</li>
                <li>Gérer la relation client et les contrats de syndic</li>
                <li>Améliorer nos services et notre site web</li>
                <li>Respecter nos obligations légales</li>
                <li>Envoyer des communications commerciales (avec votre consentement)</li>
              </ul>

              <h2>4. Base légale</h2>
              <p>Le traitement de vos données repose sur :</p>
              <ul>
                <li><strong>Exécution d'un contrat :</strong> pour la gestion des mandats de syndic</li>
                <li><strong>Intérêt légitime :</strong> pour l'amélioration de nos services</li>
                <li><strong>Consentement :</strong> pour les communications commerciales</li>
                <li><strong>Obligation légale :</strong> pour le respect des réglementations</li>
              </ul>

              <h2>5. Destinataires</h2>
              <p>Vos données peuvent être transmises à :</p>
              <ul>
                <li>Nos prestataires techniques (hébergement, emailing)</li>
                <li>Nos partenaires pour l'exécution des services</li>
                <li>Les autorités compétentes si requis par la loi</li>
              </ul>

              <h2>6. Durée de conservation</h2>
              <ul>
                <li><strong>Données de contact :</strong> 3 ans après dernier contact</li>
                <li><strong>Données contractuelles :</strong> 10 ans après fin du contrat</li>
                <li><strong>Données de navigation :</strong> 13 mois maximum</li>
              </ul>

              <h2>7. Vos droits</h2>
              <p>Vous disposez des droits suivants :</p>
              <ul>
                <li><strong>Accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Rectification :</strong> corriger vos données inexactes</li>
                <li><strong>Effacement :</strong> supprimer vos données</li>
                <li><strong>Portabilité :</strong> récupérer vos données dans un format structuré</li>
                <li><strong>Opposition :</strong> vous opposer au traitement</li>
                <li><strong>Limitation :</strong> limiter le traitement</li>
              </ul>
              
              <p>Pour exercer vos droits, contactez-nous à : <strong>tom.lemeille@xn--beam-yqa.fr</strong></p>

              <h2>8. Cookies</h2>
              <p>Notre site utilise des cookies pour :</p>
              <ul>
                <li>Assurer le bon fonctionnement du site</li>
                <li>Analyser l'audience (Google Analytics)</li>
                <li>Améliorer votre expérience utilisateur</li>
              </ul>
              <p>Vous pouvez paramétrer vos préférences cookies dans votre navigateur.</p>

              <h2>9. Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées 
                pour protéger vos données contre tout accès non autorisé, modification, 
                divulgation ou destruction.
              </p>

              <h2>10. Réclamation</h2>
              <p>
                Vous avez le droit de déposer une réclamation auprès de la CNIL 
                (Commission Nationale de l'Informatique et des Libertés) si vous 
                estimez que le traitement de vos données ne respecte pas la réglementation.
              </p>

              <h2>11. Modifications</h2>
              <p>
                Cette politique peut être mise à jour. Les modifications seront 
                publiées sur cette page avec la date de dernière mise à jour.
              </p>

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