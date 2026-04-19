'use client';

import { useState, useEffect } from 'react';

// ============================================================
// ICONS
// ============================================================

function IconDocument({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconPill({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="9" width="18" height="6" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconCoin({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15 9H10.5a1.5 1.5 0 0 0 0 3H13a1.5 1.5 0 0 1 0 3H9M12 7v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconShield({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================
// STEPS
// ============================================================

const STEPS = [
  { Icon: IconDocument, label: 'Reading your prescription...', sublabel: 'Analyzing handwriting with AI', duration: 2000 },
  { Icon: IconPill, label: 'Identifying medicines...', sublabel: 'Matching to drug database', duration: 2500 },
  { Icon: IconCoin, label: 'Finding generic alternatives...', sublabel: 'Checking Jan Aushadhi prices', duration: 2000 },
  { Icon: IconShield, label: 'Checking for interactions...', sublabel: 'Cross-referencing safety data', duration: 1500 },
];

// ============================================================
// STEP ROW
// ============================================================

function StepRow({ step, status }: {
  step: typeof STEPS[0];
  status: 'waiting' | 'active' | 'done';
}) {
  const StepIcon = step.Icon;
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500 ${
        status === 'active'
          ? 'bg-rx-card border border-rx-hairline scale-[1.02]'
          : status === 'done'
          ? 'bg-rx-card/60 opacity-60'
          : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
        status === 'active'
          ? 'bg-rx-pine-50 scale-110 text-rx-pine-700'
          : status === 'done'
          ? 'bg-rx-pine-700 text-rx-surface'
          : 'bg-rx-surface text-rx-ink-subtle'
      }`}>
        {status === 'done' ? <IconCheck className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium transition-colors duration-300 ${
          status === 'active' ? 'text-rx-ink' : 'text-rx-ink-muted'
        }`}>
          {status === 'done' ? step.label.replace('...', '') : step.label}
        </p>
        <p className={`text-xs mt-0.5 transition-colors duration-300 ${
          status === 'active' ? 'text-rx-ink-muted' : 'text-rx-ink-subtle'
        }`}>
          {step.sublabel}
        </p>
      </div>

      {status === 'active' && (
        <div className="flex-shrink-0">
          <div className="w-5 h-5 border-2 border-rx-pine-50 border-t-rx-pine-700 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ============================================================
// PULSING ICON
// ============================================================

function PulsingIcon() {
  return (
    <div className="relative w-20 h-20 mx-auto mb-8">
      <div className="absolute inset-0 rounded-full bg-rx-pine-700/15 animate-ping" />
      <div className="absolute inset-2 rounded-full bg-rx-pine-700/10 animate-ping" style={{ animationDelay: '0.5s' }} />
      <div className="relative w-full h-full rounded-full bg-rx-pine-700 flex items-center justify-center">
        <IconDocument className="w-9 h-9 text-rx-surface" />
      </div>
    </div>
  );
}

// ============================================================
// MAIN
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
      const timer = setTimeout(() => { onComplete?.(); }, 800);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => { setActiveStep((prev) => prev + 1); }, STEPS[activeStep].duration);
    return () => clearTimeout(timer);
  }, [activeStep, onComplete]);

  return (
    <div className="min-h-screen bg-rx-bg flex flex-col">
      <header className="bg-rx-card/80 backdrop-blur-md border-b border-rx-hairline">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <h1 onClick={onBack} className="font-medium text-rx-ink text-lg tracking-tight cursor-pointer">
            Rx<span className="text-rx-pine-700">Scan</span>
          </h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <PulsingIcon />

        <h2 className={`text-xl font-medium text-rx-ink text-center transition-all duration-500 ${allDone ? 'scale-105' : ''}`}>
          {allDone ? 'Your results are ready' : 'Analyzing your prescription'}
        </h2>
        <p className="text-sm text-rx-ink-muted mt-1 text-center">
          {allDone ? "Let's see what we found" : activeStep >= STEPS.length ? 'Almost there — still processing...' : 'This usually takes a few seconds'}
        </p>

        <div className="w-full max-w-sm mt-8 space-y-2">
          {STEPS.map((step, i) => {
            let status: 'waiting' | 'active' | 'done';
            if (i < activeStep) status = 'done';
            else if (i === activeStep) status = 'active';
            else status = 'waiting';
            return <StepRow key={i} step={step} status={status} />;
          })}
        </div>

        <div className="w-full max-w-sm mt-8">
          <div className="h-1 w-full rounded-full bg-rx-hairline overflow-hidden">
            <div
              className="h-full rounded-full bg-rx-pine-700 transition-all duration-700 ease-out"
              style={{ width: `${allDone ? 100 : (activeStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 pb-6">
        <p className="text-[11px] text-rx-ink-subtle leading-relaxed text-center max-w-lg mx-auto">
          RxScan helps you understand your prescription. It is not medical advice.
        </p>
      </div>
    </div>
  );
}