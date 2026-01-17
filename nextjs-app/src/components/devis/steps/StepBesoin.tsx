'use client';

import { useState } from 'react';
import { stepTwoSchema, DevisFormData } from '@/lib/validations/devis';

interface Props {
  data: Partial<DevisFormData>;
  onUpdate: (data: Partial<DevisFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MOTIFS = [
  {
    value: 'reactivite',
    label: 'Manque de reactivite',
    description: 'Difficile de joindre mon syndic actuel',
  },
  {
    value: 'transparence',
    label: 'Prix & transparence',
    description: 'Je veux comprendre ce que je paie',
  },
  {
    value: 'mise_concurrence',
    label: 'Mise en concurrence',
    description: 'Obligation legale ou fin de contrat',
  },
  {
    value: 'immeuble_neuf',
    label: 'Nouvel immeuble',
    description: 'Je cherche un premier syndic',
  },
  {
    value: 'autre',
    label: 'Autre',
    description: 'Precisez votre besoin',
  },
] as const;

type MotifValue = typeof MOTIFS[number]['value'];

export function StepBesoin({ data, onUpdate, onNext, onBack }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [selectedMotifs, setSelectedMotifs] = useState<MotifValue[]>(data.motifs || []);
  const [autreDetail, setAutreDetail] = useState<string>(data.autreDetail || '');

  const toggleMotif = (value: MotifValue) => {
    setSelectedMotifs(prev => {
      if (prev.includes(value)) {
        return prev.filter(m => m !== value);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, value];
    });
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: si "autre" est selectionne, le detail est requis
    if (selectedMotifs.includes('autre') && !autreDetail.trim()) {
      setError('Veuillez preciser votre besoin');
      return;
    }

    const result = stepTwoSchema.safeParse({ motifs: selectedMotifs, autreDetail });

    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Veuillez selectionner au moins une raison');
      return;
    }

    onUpdate({ motifs: selectedMotifs, autreDetail: autreDetail.trim() || undefined });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          Quelle est la raison de votre demande ?
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Selectionnez 1 ou 2 raisons
        </p>

        <div className="space-y-2">
          {MOTIFS.map((motif) => {
            const isSelected = selectedMotifs.includes(motif.value);
            const isDisabled = !isSelected && selectedMotifs.length >= 2;
            return (
              <label
                key={motif.value}
                className={`flex items-start p-3 border-2 rounded-lg transition-all ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer hover:border-[#FFC300] hover:shadow-[0_0_0_3px_rgba(255,195,0,0.3)]'
                } ${
                  isSelected
                    ? 'border-[#FFC300] bg-amber-50 shadow-[0_0_0_3px_rgba(255,195,0,0.3)]'
                    : 'border-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => toggleMotif(motif.value)}
                  className="sr-only"
                />
                <div>
                  <span className="font-medium text-slate-700 block">{motif.label}</span>
                  <span className="text-sm text-slate-500">{motif.description}</span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Champ de detail si "Autre" est selectionne */}
        {selectedMotifs.includes('autre') && (
          <div className="mt-3">
            <textarea
              value={autreDetail}
              onChange={(e) => setAutreDetail(e.target.value)}
              placeholder="Decrivez votre besoin..."
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-[#FFC300] focus:outline-none focus:ring-2 focus:ring-[#FFC300]/30 resize-none"
              rows={3}
            />
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 px-6 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
        >
          ← Retour
        </button>
        <button
          type="submit"
          className="flex-1 py-3 px-6 bg-[#FFC300] hover:bg-[#e6b000] text-black font-semibold rounded-lg transition"
        >
          Continuer →
        </button>
      </div>
    </form>
  );
}
