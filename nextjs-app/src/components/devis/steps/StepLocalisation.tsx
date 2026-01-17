'use client';

import { useState } from 'react';
import { stepOneSchema, DevisFormData } from '@/lib/validations/devis';

interface Props {
  data: Partial<DevisFormData>;
  onUpdate: (data: Partial<DevisFormData>) => void;
  onNext: () => void;
}

const ROLES = [
  { value: 'conseil_syndical', label: 'Membre du Conseil Syndical' },
  { value: 'coproprietaire', label: 'Coproprietaire' },
  { value: 'autre', label: 'Autre (bailleur, notaire...)' },
] as const;

export function StepLocalisation({ data, onUpdate, onNext }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localData, setLocalData] = useState({
    ville: data.ville || '',
    role: data.role || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = stepOneSchema.safeParse(localData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onUpdate(localData as Partial<DevisFormData>);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">
          Ou se situe votre copropriete ?
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Nous intervenons dans l'Eure et la Seine-Maritime
        </p>

        <input
          type="text"
          placeholder="Adresse de l'immeuble"
          value={localData.ville}
          onChange={(e) => setLocalData(prev => ({ ...prev, ville: e.target.value }))}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#FFC300] focus:border-[#FFC300] outline-none transition ${
            errors.ville ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.ville && <p className="mt-1 text-sm text-red-600">{errors.ville}</p>}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">
          Quel est votre role ?
        </h2>

        <div className="space-y-2">
          {ROLES.map((role) => (
            <label
              key={role.value}
              className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all hover:border-[#FFC300] hover:shadow-[0_0_0_3px_rgba(255,195,0,0.3)] ${
                localData.role === role.value
                  ? 'border-[#FFC300] bg-amber-50 shadow-[0_0_0_3px_rgba(255,195,0,0.3)]'
                  : 'border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={localData.role === role.value}
                onChange={(e) => setLocalData(prev => ({ ...prev, role: e.target.value }))}
                className="sr-only"
              />
              <span className="font-medium text-slate-700">{role.label}</span>
            </label>
          ))}
        </div>
        {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role}</p>}
      </div>

      <button
        type="submit"
        className="w-full py-3 px-6 bg-[#FFC300] hover:bg-[#e6b000] text-black font-semibold rounded-lg transition"
      >
        Continuer →
      </button>
    </form>
  );
}
