'use client';

import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { Download, Home, CheckCircle } from 'lucide-react';

function MerciContent() {
  const searchParams = useSearchParams();
  const prenom = searchParams.get('prenom') || '';

  return (
    <div className="w-full max-w-xl mx-auto text-center">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/" className="inline-block">
          <Image
            src="/logo-beamo.svg"
            alt="Beamo Immobilier"
            width={150}
            height={50}
            priority
          />
        </Link>
      </div>

      {/* Carte principale */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        {/* Icone succes */}
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        </div>

        {/* Message personnalise */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">
          {prenom ? `Merci ${prenom} !` : 'Merci !'}
        </h1>

        <p className="text-slate-600 mb-6">
          Votre demande a bien ete envoyee. Nous l'analysons avec attention.
        </p>

        <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-[#FFC300]">
          <p className="text-slate-800 font-medium">
            Tom vous recontacte sous 24h
          </p>
          <p className="text-slate-600 text-sm mt-1">
            Pensez a verifier vos spams si vous ne recevez pas de nouvelles
          </p>
        </div>

        {/* Lead magnet */}
        <div className="border-t pt-6">
          <p className="text-slate-700 font-medium mb-3">
            En attendant, telechargez votre cadeau :
          </p>
          <a
            href="/documents/modele-lettre-resiliation-syndic.pdf"
            download
            className="inline-flex items-center gap-2 bg-[#FFC300] hover:bg-[#e6b000] text-black px-6 py-3 rounded-lg transition font-medium"
          >
            <Download className="w-5 h-5" />
            Modele de lettre de resiliation
          </a>
          <p className="text-sm text-slate-500 mt-2">
            Document gratuit - Format PDF
          </p>
        </div>
      </div>

      {/* Lien retour */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition"
      >
        <Home className="w-4 h-4" />
        Retour a l'accueil
      </Link>
    </div>
  );
}

export default function MerciPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-xl mx-auto text-center">
        <div className="animate-pulse bg-white rounded-2xl shadow-xl p-8">
          <div className="h-16 w-16 bg-slate-200 rounded-full mx-auto mb-6" />
          <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto mb-4" />
          <div className="h-4 bg-slate-200 rounded w-full mb-2" />
          <div className="h-4 bg-slate-200 rounded w-2/3 mx-auto" />
        </div>
      </div>
    }>
      <MerciContent />
    </Suspense>
  );
}
