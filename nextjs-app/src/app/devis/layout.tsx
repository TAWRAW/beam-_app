import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demande de devis syndic | Beamo Immobilier',
  description: 'Recevez une proposition personnalisee pour la gestion de votre copropriete en Normandie. Reponse garantie sous 24h.',
  robots: 'noindex, nofollow',
};

export default function DevisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mt-20 md:-mt-24 pt-20 md:pt-24 min-h-screen bg-gradient-to-br from-slate-50 to-amber-50">
      <main className="flex justify-center py-4 px-2 md:px-4">
        {children}
      </main>
    </div>
  );
}
