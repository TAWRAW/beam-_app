import { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Sources et crédits - Beamô',
  description: 'Sources, crédits et attributions du site web de Beamô, syndic de copropriété en Normandie.',
  robots: 'noindex, nofollow',
  openGraph: {
    title: 'Sources et crédits - Beamô',
    description: 'Sources, crédits et attributions du site web de Beamô, syndic de copropriété en Normandie.',
    url: 'https://xn--beam-yqa.fr/sources',
    type: 'website',
  },
  alternates: {
    canonical: 'https://xn--beam-yqa.fr/sources',
  },
};

export default function SourcesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative -mt-20 md:-mt-24 pt-20 md:pt-24 bg-primary">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Sources et crédits
            </h1>
            <p className="text-xl text-muted-foreground">
              Technologies, ressources et attributions
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

              <h2>1. Technologies et frameworks</h2>
              <p>
                Le site <strong>Beamô</strong> est développé avec des technologies
                open-source modernes et performantes :
              </p>

              <div className="bg-muted p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3">Frontend</h3>
                <ul>
                  <li><strong>Next.js 15</strong> - Framework React pour applications web (MIT License)</li>
                  <li><strong>React 19</strong> - Bibliothèque JavaScript pour interfaces utilisateur (MIT License)</li>
                  <li><strong>TypeScript</strong> - Superset JavaScript typé (Apache 2.0 License)</li>
                  <li><strong>Tailwind CSS</strong> - Framework CSS utility-first (MIT License)</li>
                  <li><strong>shadcn/ui</strong> - Composants UI réutilisables (MIT License)</li>
                </ul>
              </div>

              <div className="bg-muted p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3">Backend & Infrastructure</h3>
                <ul>
                  <li><strong>Supabase</strong> - Backend as a Service (Apache 2.0 License)</li>
                  <li><strong>PostgreSQL</strong> - Base de données relationnelle (PostgreSQL License)</li>
                  <li><strong>Vercel</strong> - Plateforme d'hébergement et déploiement</li>
                </ul>
              </div>

              <h2>2. Bibliothèques et outils</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3">Packages npm principaux</h3>
                <ul>
                  <li><strong>@supabase/supabase-js</strong> - Client Supabase (MIT License)</li>
                  <li><strong>Radix UI</strong> - Primitives UI accessibles (MIT License)</li>
                  <li><strong>Lucide React</strong> - Icônes React (ISC License)</li>
                  <li><strong>TanStack Table</strong> - Tableaux de données puissants (MIT License)</li>
                  <li><strong>React Hook Form</strong> - Gestion de formulaires (MIT License)</li>
                  <li><strong>Zod</strong> - Validation de schémas TypeScript (MIT License)</li>
                </ul>
              </div>

              <h2>3. Design et ressources visuelles</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <h3 className="text-lg font-semibold mb-3">Polices de caractères</h3>
                <ul>
                  <li><strong>Google Fonts</strong> - Polices web gratuites</li>
                  <li>Polices utilisées sous licences SIL Open Font License</li>
                </ul>

                <h3 className="text-lg font-semibold mb-3 mt-4">Images et médias</h3>
                <ul>
                  <li>Images sous licence propriétaire Beamô ou domaine public</li>
                  <li>Certaines images proviennent de sources libres de droits mentionnées en légende</li>
                </ul>
              </div>

              <h2>4. Services tiers</h2>
              <ul>
                <li><strong>Google Analytics</strong> - Analyse d'audience</li>
                <li><strong>Google Tag Manager</strong> - Gestion des balises marketing</li>
                <li><strong>Vercel Analytics</strong> - Métriques de performance</li>
              </ul>

              <h2>5. Réglementation et normes</h2>
              <p>Le site respecte les normes et réglementations suivantes :</p>
              <ul>
                <li><strong>RGPD</strong> - Règlement Général sur la Protection des Données</li>
                <li><strong>WCAG 2.1</strong> - Web Content Accessibility Guidelines</li>
                <li><strong>HTML5</strong> et <strong>CSS3</strong> - Standards W3C</li>
                <li><strong>SEO</strong> - Optimisation pour les moteurs de recherche</li>
              </ul>

              <h2>6. Open Source</h2>
              <p>
                Nous remercions la communauté open-source pour les outils et bibliothèques
                qui rendent ce projet possible. Toutes les licences des dépendances sont
                respectées conformément à leurs termes.
              </p>
              <p>
                Pour consulter la liste complète des dépendances et leurs licences,
                vous pouvez consulter les fichiers <code>package.json</code> et
                <code>package-lock.json</code> du projet.
              </p>

              <h2>7. Code source et contributions</h2>
              <p>
                Le site web <strong>Beamô</strong> est développé et maintenu par Tom Lemeille.
              </p>
              <p>
                Les composants et patterns utilisés s'inspirent des meilleures pratiques
                de la communauté React et Next.js, notamment :
              </p>
              <ul>
                <li>Documentation officielle Next.js</li>
                <li>shadcn/ui templates et exemples</li>
                <li>Vercel examples et templates</li>
                <li>Supabase documentation et tutoriels</li>
              </ul>

              <h2>8. Crédits spéciaux</h2>
              <div className="bg-muted p-6 rounded-lg mb-6">
                <p><strong>Conception et développement :</strong> Tom Lemeille</p>
                <p><strong>Design system :</strong> Basé sur les principes de design Beamô</p>
                <p><strong>Support technique :</strong> Communauté Next.js et Supabase</p>
              </div>

              <h2>9. Liens utiles</h2>
              <ul>
                <li><a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Next.js</a></li>
                <li><a href="https://react.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">React</a></li>
                <li><a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase</a></li>
                <li><a href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Tailwind CSS</a></li>
                <li><a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">shadcn/ui</a></li>
                <li><a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Vercel</a></li>
              </ul>

              <h2>10. Signaler un problème</h2>
              <p>
                Si vous identifiez une erreur d'attribution, un problème de licence
                ou souhaitez obtenir plus d'informations sur nos sources,
                n'hésitez pas à nous contacter :
              </p>
              <ul>
                <li><strong>Email :</strong> bonjour@beamo-copro.fr</li>
                <li><strong>Téléphone :</strong> 07 75 70 70 99</li>
              </ul>

              <p className="text-sm text-muted-foreground mt-8">
                <strong>Dernière mise à jour :</strong> 22 octobre 2025
              </p>

              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
