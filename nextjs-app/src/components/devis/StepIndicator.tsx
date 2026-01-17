import { Check } from 'lucide-react';

interface Props {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

const steps = [
  { num: 1, label: 'Situation' },
  { num: 2, label: 'Besoin' },
  { num: 3, label: 'Contact' },
];

export function StepIndicator({ currentStep, onStepClick }: Props) {
  const handleStepClick = (stepNum: number) => {
    // Permet seulement de revenir en arriere, pas d'avancer
    if (stepNum < currentStep && onStepClick) {
      onStepClick(stepNum);
    }
  };

  return (
    <div className="flex items-start justify-between">
      {steps.map((step, index) => {
        const canClick = step.num < currentStep;
        return (
          <div key={step.num} className="flex items-center flex-1 last:flex-none">
            {/* Cercle numerote + label */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => handleStepClick(step.num)}
                disabled={!canClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  currentStep >= step.num
                    ? 'bg-[#FFC300] text-black'
                    : 'bg-slate-200 text-slate-500'
                } ${canClick ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
              >
                {currentStep > step.num ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.num
                )}
              </button>
              <span className={`text-xs mt-1 ${currentStep >= step.num ? 'text-slate-800' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>

            {/* Ligne de connexion - centree verticalement avec le cercle */}
            {index < steps.length - 1 && (
              <div className="flex-1 flex items-center px-2" style={{ marginTop: '-1rem' }}>
                <div
                  className={`w-full h-1 rounded ${
                    currentStep > step.num ? 'bg-[#FFC300]' : 'bg-slate-200'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
