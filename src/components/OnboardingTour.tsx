/**
 * ENHANCEMENT #10: Onboarding Tutorial for First-Run
 */

import { useState, useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  action: string;
  target?: string;
}

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    // Check if user has already completed onboarding
    const seen = localStorage.getItem('onboarding-tour-completed');
    setHasSeenTour(!!seen);
    setCompleted(!!seen);
  }, []);

  const handleComplete = () => {
    localStorage.setItem('onboarding-tour-completed', 'true');
    setCompleted(true);
  };

  const steps: OnboardingStep[] = [
    {
      title: '?? Welcome to CoreLogic Studio',
      description: 'A professional DAW (Digital Audio Workstation) for audio production and mixing.',
      action: 'Click "Next" to continue',
    },
    {
      title: '??? Create Your First Track',
      description: 'Add an audio track by clicking the + button in the left panel. Audio tracks are for recordings and samples.',
      action: 'Create a track to proceed',
    },
    {
      title: '?? Transport Controls',
      description: 'Use the Play, Stop, and Record buttons at the top to control playback and recording.',
      action: 'Press Play when ready',
    },
    {
      title: '??? Mix Your Audio',
      description: 'Use the mixer at the bottom to adjust volume, panning, and apply effects to your tracks.',
      action: 'Explore the mixer panel',
    },
    {
      title: '?? Keyboard Shortcuts',
      description: 'Press Ctrl+K to open the command palette and quickly access all functions. Try it now!',
      action: 'Ready to create',
    },
  ];

  const currentStep = steps[step];

  if (completed || hasSeenTour) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md p-6 space-y-4 border border-gray-700 animate-in fade-in duration-300">
        {/* Close Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">{currentStep.title}</h2>
          <button
            onClick={handleComplete}
            className="p-1 hover:bg-gray-700 rounded transition"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <p className="text-sm text-gray-300">{currentStep.description}</p>
        <p className="text-xs text-blue-400 font-semibold">{currentStep.action}</p>

        {/* Navigation */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex-1 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition"
          >
            Back
          </button>
          <button
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                handleComplete();
              }
            }}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded flex items-center justify-center gap-1 text-white transition font-medium"
          >
            {step < steps.length - 1 ? 'Next' : 'Get Started'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-1">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx <= step ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
