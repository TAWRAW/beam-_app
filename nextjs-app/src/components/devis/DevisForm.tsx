'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from './StepIndicator';
import { StepLocalisation } from './steps/StepLocalisation';
import { StepBesoin } from './steps/StepBesoin';
import { StepContact } from './steps/StepContact';
import { DevisFormData } from '@/lib/validations/devis';

const TOTAL_STEPS = 3;

export function DevisForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Etat du formulaire (persiste entre les etapes)
  const [formData, setFormData] = useState<Partial<DevisFormData>>({});

  const updateFormData = (data: Partial<DevisFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step < currentStep && step >= 1) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async (finalData: Partial<DevisFormData>) => {
    setIsSubmitting(true);
    setError(null);

    const completeData = { ...formData, ...finalData };

    try {
      const response = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Une erreur est survenue');
      }

      // Redirection vers page de remerciement avec parametres
      const params = new URLSearchParams({
        prenom: completeData.prenom || '',
      });
      router.push(`/devis/merci?${params.toString()}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6">
      {/* Indicateur de progression */}
      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} onStepClick={goToStep} />

      {/* Message d'erreur global */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Etapes du formulaire */}
      <div className="mt-6">
        {currentStep === 1 && (
          <StepLocalisation
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        )}
        {currentStep === 2 && (
          <StepBesoin
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {currentStep === 3 && (
          <StepContact
            data={formData}
            onSubmit={handleSubmit}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
