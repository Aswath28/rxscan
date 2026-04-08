'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================
// MOCK: Sample result for "Try a Sample" demo
// ============================================================

const SAMPLE_MEDICINES = [
  { name: 'Augmentin 625', generic: 'Amoxicillin + Clavulanic Acid', brandPrice: 250, genericPrice: 45 },
  { name: 'Pan-D', generic: 'Pantoprazole + Domperidone', brandPrice: 180, genericPrice: 25 },
  { name: 'Levocetirizine 5mg', generic: 'Levocetirizine', brandPrice: 55, genericPrice: 8 },
  { name: 'Ambrodil-S Syrup', generic: 'Ambroxol + Salbutamol', brandPrice: 95, genericPrice: 22 },
];


// ============================================================
// COMPONENT: Floating Pill (decorative)
// ============================================================

function FloatingPills() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Subtle floating shapes */}
      <div className="absolute top-20 -left-6 w-12 h-12 rounded-full bg-emerald-200/30 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute top-40 -right-4 w-8 h-8 rounded-full bg-emerald-300/20 animate-[float_8s_ease-in-out_infinite_1s]" />
      <div className="absolute bottom-32 -left-3 w-6 h-6 rounded-full bg-emerald-200/25 animate-[float_7s_ease-in-out_infinite_2s]" />
    </div>
  );
}


// ============================================================
// COMPONENT: Sample Result Mini-Card
// ============================================================

function SampleMiniCard({ medicine }: { medicine: typeof SAMPLE_MEDICINES[0] }) {
  const savings = Math.round(((medicine.brandPrice - medicine.genericPrice) / medicine.brandPrice) * 100);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{medicine.name}</p>
        <p className="text-xs text-slate-400 truncate">{medicine.generic}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <span className="text-xs text-slate-400 line-through">₹{medicine.brandPrice}</span>
        <span className="text-sm font-semibold text-emerald-600">₹{medicine.genericPrice}</span>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
          -{savings}%
        </span>
      </div>
    </div>
  );
}


// ============================================================
// COMPONENT: How It Works Step
// ============================================================

function HowItWorksStep({ number, icon, title, description }: {
  number: number; icon: string; title: string; description: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-emerald-600/20">
        {number}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}


// ============================================================
// COMPONENT: Stat Counter
// ============================================================

function StatBar() {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      {[
        { value: '1,800+', label: 'Medicines' },
        { value: '₹500+', label: 'Avg savings' },
        { value: '94%', label: 'OCR accuracy' },
      ].map((stat, i) => (
        <div key={i} className="text-center">
          <div className="text-lg font-bold text-emerald-600">{stat.value}</div>
          <div className="text-[11px] text-slate-400 font-medium">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}


// ============================================================
// DATA: Did You Know facts
// ============================================================

const DID_YOU_KNOW_FACTS = [
  "The Indian government runs 12,000+ Jan Aushadhi stores selling generic medicines at up to 90% less than branded versions. Same molecule, same quality — just without the brand markup.",
  "The same Paracetamol 500mg tablet costs ₹30 as Crocin and ₹5 as a generic — same molecule, same CDSCO certification.",
  "India has the world's largest generic pharmaceutical industry — but most patients never benefit because doctors prescribe by brand name.",
  "CDSCO certifies generic medicines as bioequivalent — meaning they work the same way in your body as the branded version.",
];


// ============================================================
// COMPONENT: Did You Know Carousel (swipeable + auto-rotate)
// ============================================================

function DidYouKnowCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback((nextIndex: number, dir: 'left' | 'right') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setDirection(dir);
    // Brief delay to let exit animation play, then switch content
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setDirection(null);
      setIsAnimating(false);
    }, 250);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    const next = (currentIndex + 1) % DID_YOU_KNOW_FACTS.length;
    goTo(next, 'left');
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    const prev = (currentIndex - 1 + DID_YOU_KNOW_FACTS.length) % DID_YOU_KNOW_FACTS.length;
    goTo(prev, 'right');
  }, [currentIndex, goTo]);

  // Auto-rotate every 10 seconds
  useEffect(() => {
    autoPlayRef.current = setInterval(goNext, 10000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [goNext]);

  // Reset auto-rotate timer on manual interaction
  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(goNext, 10000);
  }, [goNext]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // minimum swipe distance
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goNext(); // swipe left → next
      } else {
        goPrev(); // swipe right → prev
      }
      resetAutoPlay();
    }
  };

  // Determine animation class
  let animClass = 'opacity-100 translate-x-0';
  if (direction === 'left') animClass = 'opacity-0 -translate-x-4';
  if (direction === 'right') animClass = 'opacity-0 translate-x-4';

  return (
    <section
      className="mt-6 rounded-xl bg-blue-50 border border-blue-100 p-4 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0">💡</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-blue-900">Did you know?</h4>
          <p className={`text-sm text-blue-700 mt-1 leading-relaxed transition-all duration-250 ease-in-out ${animClass}`}>
            {DID_YOU_KNOW_FACTS[currentIndex]}
          </p>
        </div>
      </div>

      {/* Dots + arrows */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => { goPrev(); resetAutoPlay(); }}
          className="text-blue-400 hover:text-blue-600 p-1 -ml-1"
          aria-label="Previous fact"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-1.5">
          {DID_YOU_KNOW_FACTS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-4 bg-blue-500' : 'w-1.5 bg-blue-300/50'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => { goNext(); resetAutoPlay(); }}
          className="text-blue-400 hover:text-blue-600 p-1 -mr-1"
          aria-label="Next fact"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}


// ============================================================
// MAIN: Landing Page
// ============================================================

interface LandingPageProps {
  onScanClick: () => void;
  onTrySample: () => void;
  onMyMedicines: () => void;
}

export default function LandingPage({ onScanClick, onTrySample, onMyMedicines }: LandingPageProps) {
  const [showSample, setShowSample] = useState(false);
  const [sampleVisible, setSampleVisible] = useState(false);

  const toggleSample = () => {
    if (!showSample) {
      // Opening: mount first, then animate in
      setShowSample(true);
      requestAnimationFrame(() => setSampleVisible(true));
    } else {
      // Closing: animate out first, then unmount
      setSampleVisible(false);
      setTimeout(() => setShowSample(false), 300);
    }
  };

  const brandTotal = SAMPLE_MEDICINES.reduce((s, m) => s + m.brandPrice, 0);
  const genericTotal = SAMPLE_MEDICINES.reduce((s, m) => s + m.genericPrice, 0);
  const totalSavings = brandTotal - genericTotal;

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <FloatingPills />

      {/* Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="w-12" />
          <h1 className="font-bold text-slate-900 text-xl tracking-tight">
            Rx<span className="text-emerald-600">Scan</span>
          </h1>
          <button
            onClick={onMyMedicines}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
          >
            <svg className="w-3.5 h-3.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-semibold text-slate-700">My Medicines</span>
          </button>
        </div>
      </header>
      <main className="relative z-10 max-w-lg mx-auto px-4 pb-8">

        {/* ====== HERO SECTION ====== */}
        <section className="pt-8 pb-6 text-center">
          {/* Prescription → List illustration */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-20 rounded-lg bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center p-2 rotate-[-3deg]">
              {/* Squiggly lines representing handwriting */}
              <div className="space-y-1.5 w-full">
                <div className="h-1 bg-slate-300 rounded-full w-full" />
                <div className="h-1 bg-slate-300 rounded-full w-[80%]" />
                <div className="h-1 bg-slate-300 rounded-full w-[90%]" />
                <div className="h-1 bg-slate-300 rounded-full w-[60%]" />
                <div className="h-1 bg-slate-300 rounded-full w-[75%]" />
              </div>
            </div>

            {/* Arrow */}
            <svg className="w-8 h-8 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>

            <div className="w-16 h-20 rounded-lg bg-emerald-600 shadow-sm flex items-center justify-center p-2 rotate-[3deg] shadow-emerald-600/20">
              {/* Clean list representing structured output */}
              <div className="space-y-1.5 w-full">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  <div className="h-1 bg-white/60 rounded-full flex-1" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  <div className="h-1 bg-white/60 rounded-full flex-1" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                  <div className="h-1 bg-white/60 rounded-full flex-1" />
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  <div className="h-1 bg-emerald-300/60 rounded-full flex-1" />
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">
            Scan your prescription.<br />
            Know your medicines.<br />
            <span className="text-emerald-600">Stop overpaying.</span>
          </h2>

          <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
            AI reads your doctor's handwriting and shows you
            generic alternatives that save 50–90% on medicines.
          </p>

          {/* Primary CTA */}
          <button
            onClick={onScanClick}
            className="mt-6 w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-4 px-6 rounded-2xl text-base transition-colors shadow-lg shadow-emerald-600/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan Your Prescription
          </button>

          {/* Secondary CTA */}
          <button
            onClick={toggleSample}
            className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2 decoration-emerald-300"
          >
            {showSample ? '← Hide sample' : 'Try a sample first →'}
          </button>
        </section>

        {/* ====== SAMPLE RESULT (toggle) ====== */}
        {showSample && (
          <section className={`mb-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ease-in-out ${
            sampleVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-2'
          }`}>
            {/* Savings header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3">
              <p className="text-xs text-emerald-100 font-medium">Sample: Flu Prescription — 4 medicines</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-white">₹{totalSavings}</span>
                <span className="text-sm text-emerald-200">potential savings</span>
              </div>
            </div>

           {/* Medicine list */}
            <div className="px-4 py-2">
              {SAMPLE_MEDICINES.map((m, i) => (
                <SampleMiniCard key={i} medicine={m} />
              ))}
            </div>

            {/* CTA to see full results */}
            <div className="px-4 pb-4">
              <button
                onClick={onTrySample}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                See full results →
              </button>
            </div>

          </section>
        )}

        {/* ====== STATS BAR ====== */}
        <StatBar />

        {/* ====== HOW IT WORKS ====== */}
        <section className="mt-4 mb-8">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
            How it works
          </h3>
          <div className="space-y-5">
            <HowItWorksStep
              number={1}
              icon="📸"
              title="Snap"
              description="Take a photo of your handwritten prescription. Works with any doctor's handwriting."
            />
            <HowItWorksStep
              number={2}
              icon="🤖"
              title="Read"
              description="AI identifies every medicine, dosage, and frequency — even from messy handwriting."
            />
            <HowItWorksStep
              number={3}
              icon="💰"
              title="Save"
              description="See generic alternatives with prices. Know exactly how much you can save."
            />
          </div>
        </section>

        {/* ====== TRUST STRIP ====== */}
        <section className="rounded-xl bg-white border border-slate-200 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: '🔒', label: 'No data stored' },
              { icon: '🆓', label: '100% free' },
              { icon: '👤', label: 'No signup' },
            ].map((item, i) => (
              <div key={i}>
                <span className="text-xl">{item.icon}</span>
                <p className="text-xs text-slate-600 font-medium mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ====== EDUCATIONAL CAROUSEL ====== */}
        <DidYouKnowCarousel />

        {/* ====== FOOTER DISCLAIMER ====== */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            RxScan helps you understand your prescription. It is NOT medical advice.
            Always confirm with your doctor or pharmacist before making any changes to your medication.
          </p>
          <p className="text-[11px] text-slate-300 mt-2">
            Built with ❤️ for every Indian patient
          </p>
        </div>
      </main>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}