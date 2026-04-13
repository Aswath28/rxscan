'use client';

import { useState, useEffect } from 'react';

// ============================================================
// Processing steps — each appears sequentially
// ============================================================

const STEPS = [
  {
    icon: '📋',
    label: 'Reading your prescription...',
    sublabel: 'Analyzing handwriting with AI',
    duration: 2000,
  },
  {
    icon: '💊',
    label: 'Identifying medicines...',
    sublabel: 'Matching to drug database',
    duration: 2500,
  },
  {
    icon: '💰',
    label: 'Finding generic alternatives...',
    sublabel: 'Checking Jan Aushadhi prices',
    duration: 2000,
  },
  {
    icon: '🛡️',
    label: 'Checking for interactions...',
    sublabel: 'Cross-referencing safety data',
    duration: 1500,
  },
];

// ============================================================
// COMPONENT: Single Step Row
// ============================================================

function StepRow({ step, status }: {
  step: typeof STEPS[0];
  status: 'waiting' | 'active' | 'done';
}) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 ${
        status === 'active'
          ? 'bg-white shadow-md scale-[1.02]'
          : status === 'done'
          ? 'bg-white/60 opacity-60'
          : 'opacity-0 translate-y-4'
      }`}
    >
      {/* Icon / check */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all duration-300 ${
        status === 'active'
          ? 'bg-emerald-100 scale-110'
          : status === 'done'
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-100'
      }`}>
        {status === 'done' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span>{step.icon}</span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold transition-colors duration-300 ${
          status === 'active' ? 'text-slate-900' : 'text-slate-500'
        }`}>
          {status === 'done' ? step.label.replace('...', '') + ' ✓' : step.label}
        </p>
        <p className={`text-xs mt-0.5 transition-colors duration-300 ${
          status === 'active' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {step.sublabel}
        </p>
      </div>

      {/* Spinner for active */}
      {status === 'active' && (
        <div className="flex-shrink-0">
          <div className="w-5 h-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENT: Pulsing Prescription Icon
// ============================================================

function PulsingIcon() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-8">
      {/* Pulse rings */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDelay: '0.5s' }} />
      {/* Center icon */}
      <div className="relative w-full h-full rounded-full bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
        <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
    </div>
  );
}

// ============================================================
// MAIN: Processing Screen
// ============================================================

interface ProcessingScreenProps {
  onComplete?: () => void;
  onBack?: () => void;
}

export default function ProcessingScreen({ onComplete, onBack }: ProcessingScreenProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (activeStep >= STEPS.length) {
      setAllDone(true);
      const timer = setTimeout(() => {
        onComplete?.();
      }, 800);
      return () => clearTimeout(timer);
    }

    // Move to next step after current step's duration
    const timer = setTimeout(() => {
      setActiveStep((prev) => prev + 1);
    }, STEPS[activeStep].duration);

    return () => clearTimeout(timer);
  }, [activeStep, onComplete]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <h1 onClick={onBack} className="font-bold text-slate-900 text-lg tracking-tight cursor-pointer">
            Rx<span className="text-emerald-600">Scan</span>
          </h1>
        </div>
      </header>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <PulsingIcon />

        <h2 className={`text-xl font-bold text-slate-900 text-center transition-all duration-500 ${
          allDone ? 'scale-105' : ''
        }`}>
          {allDone ? 'Your results are ready!' : 'Analyzing your prescription'}
        </h2>
        <p className="text-sm text-slate-500 mt-1 text-center">
{allDone ? 'Let\'s see what we found' : activeStep >= STEPS.length ? 'Almost there — still processing...' : 'This usually takes a few seconds'}        </p>

        {/* Steps list */}
        <div className="w-full max-w-sm mt-8 space-y-2">
          {STEPS.map((step, i) => {
            let status: 'waiting' | 'active' | 'done';
            if (i < activeStep) status = 'done';
            else if (i === activeStep) status = 'active';
            else status = 'waiting';

            return <StepRow key={i} step={step} status={status} />;
          })}
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-sm mt-8">
          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${allDone ? 100 : (activeStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom disclaimer */}
      <div className="px-4 pb-6">
        <p className="text-[11px] text-slate-400 leading-relaxed text-center max-w-lg mx-auto">
          RxScan helps you understand your prescription. It is NOT medical advice.
        </p>
      </div>
    </div>
  );
}
