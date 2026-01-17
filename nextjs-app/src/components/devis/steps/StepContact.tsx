'use client';

import { useState } from 'react';
import { stepThreeSchema, DevisFormData } from '@/lib/validations/devis';
import { Loader2 } from 'lucide-react';

interface Props {
  data: Partial<DevisFormData>;
  onSubmit: (data: Partial<DevisFormData>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const TAILLES = [
  { value: 'moins_10', label: 'Moins de 10 lots' },
  { value: '10_20', label: '10 a 20 lots' },
  { value: '20_50', label: '20 a 50 lots' },
  { value: 'plus_50', label: 'Plus de 50 lots' },
] as const;

export function StepContact({ data, onSubmit, onBack, isSubmitting }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [localData, setLocalData] = useState({
    nombreLots: data.nombreLots || '',
    prenom: data.prenom || '',
    nom: data.nom || '',
    email: data.email || '',
    telephone: data.telephone || '',
    website: '', // Honeypot
  });

  const handleChange = (field: string, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const result = stepThreeSchema.safeParse(localData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit(localData as Partial<DevisFormData>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Message personnalise */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <div className="w-10 h-10 bg-[#FFC300] rounded-full flex items-center justify-center text-black font-bold shrink-0">
          T
        </div>
        <p className="text-sm text-slate-700">
          <span className="font-medium">Tom vous rappelle sous 24h</span>
        </p>
      </div>

      {/* Taille copropriete */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Taille de votre copropriete
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TAILLES.map((taille) => (
            <label
              key={taille.value}
              className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all hover:border-[#FFC300] hover:shadow-[0_0_0_3px_rgba(255,195,0,0.3)] ${
                localData.nombreLots === taille.value
                  ? 'border-[#FFC300] bg-amber-50 shadow-[0_0_0_3px_rgba(255,195,0,0.3)]'
                  : 'border-slate-200'
              }`}
            >
              <input
                type="radio"
                name="nombreLots"
                value={taille.value}
                checked={localData.nombreLots === taille.value}
                onChange={(e) => handleChange('nombreLots', e.target.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-slate-700">{taille.label}</span>
            </label>
          ))}
        </div>
        {errors.nombreLots && <p className="mt-1 text-sm text-red-600">{errors.nombreLots}</p>}
      </div>

      {/* Nom / Prenom */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Prenom</label>
          <input
            type="text"
            value={localData.prenom}
            onChange={(e) => handleChange('prenom', e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FFC300] outline-none ${
              errors.prenom ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
          <input
            type="text"
            value={localData.nom}
            onChange={(e) => handleChange('nom', e.target.value)}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FFC300] outline-none ${
              errors.nom ? 'border-red-500' : 'border-slate-300'
            }`}
          />
          {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          type="email"
          value={localData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="votre@email.fr"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FFC300] outline-none ${
            errors.email ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      {/* Telephone */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Telephone mobile <span className="text-slate-400">(pour vous rappeler)</span>
        </label>
        <input
          type="tel"
          value={localData.telephone}
          onChange={(e) => handleChange('telephone', e.target.value)}
          placeholder="06 XX XX XX XX"
          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FFC300] outline-none ${
            errors.telephone ? 'border-red-500' : 'border-slate-300'
          }`}
        />
        {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
      </div>

      {/* Honeypot - cache */}
      <input
        type="text"
        name="website"
        value={localData.website}
        onChange={(e) => handleChange('website', e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Boutons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
        >
          ← Retour
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 px-6 bg-[#FFC300] hover:bg-[#e6b000] text-black font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Envoi...
            </span>
          ) : (
            'Recevoir ma proposition →'
          )}
        </button>
      </div>

      {/* Reassurance sous le CTA */}
      <p className="text-center text-sm text-slate-500">
        Reponse garantie sous 24h · Sans engagement
      </p>
    </form>
  );
}
