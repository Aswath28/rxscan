'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================
// SAMPLE DATA (used in the mini preview card)
// ============================================================

const SAMPLE_MEDICINES = [
  { name: 'Augmentin 625', generic: 'Amoxicillin + Clavulanic Acid', brandPrice: 250, genericPrice: 45 },
  { name: 'Pan-D', generic: 'Pantoprazole + Domperidone', brandPrice: 180, genericPrice: 25 },
  { name: 'Levocetirizine 5mg', generic: 'Levocetirizine', brandPrice: 55, genericPrice: 8 },
  { name: 'Ambrodil-S Syrup', generic: 'Ambroxol + Salbutamol', brandPrice: 95, genericPrice: 22 },
];

// ============================================================
// ICON COMPONENTS — matching the results screen aesthetic
// ============================================================

function IconCamera({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconSpark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconCoin({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15 9H10.5a1.5 1.5 0 0 0 0 3H13a1.5 1.5 0 0 1 0 3H9M12 7v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconLock({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function IconGift({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="8" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13M12 8s-3-5-6-3 1 5 6 3zM12 8s3-5 6-3-1 5-6 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconUser({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconBookmark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 4h12v17l-6-4-6 4V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconBulb({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8 1 1.5 2.5 1.5 3.5h5c0-1 .7-2.5 1.5-3.5A6 6 0 0 0 12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPillCapsule({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 14.5L14.5 4a4.95 4.95 0 017 7L11 21.5a4.95 4.95 0 01-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9.5 9.5l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ============================================================
// HERO: Mini preview card with dark savings banner behind
// ============================================================

function HeroPreview() {
  return (
    <div className="relative mx-auto mb-6 h-[200px] w-full max-w-[320px]">
      {/* Dark savings hero — tilted back-left */}
      <div
        className="absolute left-0 top-2 w-[82%] rotate-[-4deg] rounded-[18px] bg-rx-hero-bg p-3.5 shadow-rx-hero"
        aria-hidden
      >
        <div className="flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" className="text-rx-mint">
            <path d="M7 1.5l1.5 4L12.5 7l-4 1.5L7 12.5 5.5 8.5 1.5 7l4-1.5L7 1.5z" fill="currentColor" />
          </svg>
          <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-rx-mint">
            You could save
          </div>
        </div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-[28px] font-extrabold leading-none tracking-[-0.02em] text-white">
            ₹480
          </span>
          <span className="rounded-full bg-rx-mint px-1.5 py-0.5 text-[8px] font-bold text-rx-hero-bg">
            83% off
          </span>
        </div>
        <div className="mt-1 text-[9px] leading-tight text-rx-cream-muted">
          on CDSCO-certified generics
        </div>
      </div>

      {/* Medicine card — tilted forward-right, overlapping */}
      <div className="absolute right-0 top-[88px] w-[82%] rotate-[3deg] rounded-[16px] bg-rx-card p-3 shadow-rx-float">
        <div className="flex gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-rx-coral-50">
            <IconPillCapsule className="h-[18px] w-[18px] text-rx-coral-700" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="text-[8px] font-medium uppercase tracking-wider text-rx-ink-subtle">
              Prescription says "Augmentin"
            </div>
            <div className="text-[12px] font-bold leading-tight text-rx-ink">
              Amoxicillin + Clavulanate
            </div>
            <div className="text-[10px] font-medium text-rx-coral-700">Antibiotic</div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between rounded-[10px] bg-rx-surface px-2.5 py-1.5">
          <div className="flex items-baseline gap-1">
            <span className="text-[14px] font-extrabold text-rx-ink">₹45</span>
            <span className="text-[10px] text-rx-ink-subtle line-through">₹250</span>
          </div>
          <div className="rounded-full bg-rx-pine-700 px-2 py-0.5 text-[9px] font-bold text-white">
            Save 82%
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SAMPLE MINI CARD (used in toggle-open preview section)
// ============================================================

function SampleMiniCard({ medicine }: { medicine: typeof SAMPLE_MEDICINES[0] }) {
  const savings = Math.round(((medicine.brandPrice - medicine.genericPrice) / medicine.brandPrice) * 100);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-rx-hairline last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-bold text-rx-ink truncate">{medicine.name}</p>
        <p className="text-xs text-rx-ink-muted truncate">{medicine.generic}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <span className="text-xs text-rx-ink-subtle line-through">₹{medicine.brandPrice}</span>
        <span className="text-sm font-bold text-rx-ink">₹{medicine.genericPrice}</span>
        <span className="text-[10px] font-bold text-rx-pine-700 bg-rx-pine-50 px-1.5 py-0.5 rounded">
          -{savings}%
        </span>
      </div>
    </div>
  );
}

// ============================================================
// HOW IT WORKS STEP — colored avatars matching results screen
// ============================================================

type StepColor = {
  bg: string;
  text: string;
  ring: string;
};

function HowItWorksStep({
  number,
  Icon,
  color,
  title,
  description,
}: {
  number: number;
  Icon: React.ComponentType<{ className?: string }>;
  color: StepColor;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3.5 items-start">
      {/* Numbered + colored avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-12 h-12 rounded-[14px] ${color.bg} flex items-center justify-center shadow-rx-card`}>
          <Icon className={`w-6 h-6 ${color.text}`} />
        </div>
        {/* Tiny number badge */}
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rx-ink text-white text-[10px] font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <div className="pt-1">
        <h3 className="font-bold text-rx-ink text-[15px]">{title}</h3>
        <p className="text-[13px] text-rx-ink-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

// ============================================================
// STATS BAR — cleaner, bolder numbers
// ============================================================

function StatBar() {
  const stats = [
    { value: '94%', label: 'OCR accuracy' },
    { value: '140+', label: 'Interactions checked' },
    { value: '4K+', label: 'Brands recognized' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 py-5">
      {stats.map((stat, i) => (
        <div key={i} className="text-center">
          <div className="text-xl font-extrabold text-rx-pine-700 tracking-tight">{stat.value}</div>
          <div className="text-[11px] text-rx-ink-muted font-medium mt-0.5 leading-tight">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// TRUST STRIP — colored badges instead of floating icons
// ============================================================

function TrustStrip() {
  const items = [
    { Icon: IconLock, label: 'No data stored', bg: 'bg-rx-sky-50', text: 'text-rx-sky-700' },
    { Icon: IconGift, label: '100% free', bg: 'bg-rx-peach-50', text: 'text-rx-peach-700' },
    { Icon: IconUser, label: 'No signup', bg: 'bg-rx-lavender-50', text: 'text-rx-lavender-700' },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item, i) => {
        const ItemIcon = item.Icon;
        return (
          <div
            key={i}
            className="rounded-[14px] bg-rx-card border border-rx-hairline p-3 flex flex-col items-center text-center shadow-rx-card"
          >
            <div className={`w-9 h-9 rounded-[10px] ${item.bg} flex items-center justify-center mb-1.5`}>
              <ItemIcon className={`w-[18px] h-[18px] ${item.text}`} />
            </div>
            <p className="text-[11px] text-rx-ink font-bold leading-tight">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// DID YOU KNOW FACTS
// ============================================================

const DID_YOU_KNOW_FACTS = [
  "The Indian government runs 12,000+ Jan Aushadhi stores selling generic medicines at up to 90% less than branded versions. Same molecule, same quality — just without the brand markup.",
  "The same Paracetamol 500mg tablet costs ₹30 as Crocin and ₹5 as a generic — same molecule, same CDSCO certification.",
  "India has the world's largest generic pharmaceutical industry — but most patients never benefit because doctors prescribe by brand name.",
  "Elderly patients seeing 2–3 specialists often end up on medicines that interact with each other. No pharmacist in India routinely checks for this.",
  "CDSCO certifies generic medicines as bioequivalent — meaning they work the same way in your body as the branded version.",
];

// ============================================================
// DID YOU KNOW CAROUSEL — dark treatment, Scapia-style
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
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setDirection(null);
      setIsAnimating(false);
    }, 250);
  }, [isAnimating]);

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % DID_YOU_KNOW_FACTS.length, 'left');
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo((currentIndex - 1 + DID_YOU_KNOW_FACTS.length) % DID_YOU_KNOW_FACTS.length, 'right');
  }, [currentIndex, goTo]);

  useEffect(() => {
    autoPlayRef.current = setInterval(goNext, 10000);
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [goNext]);

  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(goNext, 10000);
  }, [goNext]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
      resetAutoPlay();
    }
  };

  let animClass = 'opacity-100 translate-x-0';
  if (direction === 'left') animClass = 'opacity-0 -translate-x-4';
  if (direction === 'right') animClass = 'opacity-0 translate-x-4';

  return (
    <section
      className="mt-6 relative overflow-hidden rounded-[20px] bg-rx-hero-bg p-5 select-none shadow-rx-hero"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-rx-mint opacity-[0.08] blur-2xl" />

      <div className="relative flex items-start gap-3">
        <div className="w-9 h-9 rounded-[10px] bg-rx-mint/20 flex items-center justify-center flex-shrink-0">
          <IconBulb className="w-[18px] h-[18px] text-rx-mint" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[11px] font-bold text-rx-mint uppercase tracking-[0.1em]">Did you know?</h4>
          <p className={`text-[14px] text-white mt-1.5 leading-relaxed transition-all duration-250 ease-in-out ${animClass}`}>
            {DID_YOU_KNOW_FACTS[currentIndex]}
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-between mt-4">
        <button
          onClick={() => { goPrev(); resetAutoPlay(); }}
          className="text-rx-cream-muted hover:text-white p-1 -ml-1 transition-colors"
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
                i === currentIndex ? 'w-5 bg-rx-mint' : 'w-1.5 bg-white/30'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => { goNext(); resetAutoPlay(); }}
          className="text-rx-cream-muted hover:text-white p-1 -mr-1 transition-colors"
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
      setShowSample(true);
      requestAnimationFrame(() => setSampleVisible(true));
    } else {
      setSampleVisible(false);
      setTimeout(() => setShowSample(false), 300);
    }
  };

  const brandTotal = SAMPLE_MEDICINES.reduce((s, m) => s + m.brandPrice, 0);
  const genericTotal = SAMPLE_MEDICINES.reduce((s, m) => s + m.genericPrice, 0);
  const totalSavings = brandTotal - genericTotal;

  // Step color palettes — matching results-screen category system
  const stepColors: StepColor[] = [
    { bg: 'bg-rx-sky-50', text: 'text-rx-sky-700', ring: 'ring-rx-sky-100' },
    { bg: 'bg-rx-lavender-50', text: 'text-rx-lavender-700', ring: 'ring-rx-lavender-100' },
    { bg: 'bg-rx-pine-50', text: 'text-rx-pine-700', ring: 'ring-rx-pine-100' },
  ];

  return (
    <div className="min-h-screen bg-rx-bg relative">
      {/* Header */}
      <header className="relative z-10 bg-rx-bg/80 backdrop-blur-md border-b border-rx-hairline">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="w-10" />
          <h1 className="font-extrabold text-rx-ink text-xl tracking-tight">
            Rx<span className="text-rx-pine-700">Scan</span>
          </h1>
          <button
            onClick={onMyMedicines}
            className="flex items-center gap-1.5 bg-rx-card border border-rx-hairline hover:bg-rx-surface px-3 py-1.5 rounded-full transition-colors shadow-rx-card"
          >
            <IconBookmark className="w-3.5 h-3.5 text-rx-ink" />
            <span className="text-xs font-bold text-rx-ink">My Medicines</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-lg mx-auto px-4 pb-8">
        {/* HERO */}
        <section className="pt-6 pb-4 text-center">
          {/* Mini preview — shows the product within 3 seconds */}
          <HeroPreview />

          <h2 className="text-[26px] font-extrabold text-rx-ink leading-[1.15] tracking-[-0.02em] mt-3">
            Scan your prescription.<br />
            Know your medicines.<br />
            <span className="text-rx-pine-700">Stop overpaying.</span>
          </h2>

          <p className="mt-3 text-sm text-rx-ink-muted leading-relaxed max-w-xs mx-auto">
            AI reads your doctor's handwriting and shows you
            generic alternatives that save 50–90% on medicines.
          </p>

          {/* Primary CTA */}
          <button
            onClick={onScanClick}
            className="mt-5 w-full flex items-center justify-center gap-2.5 bg-rx-pine-700 hover:bg-rx-pine-900 active:opacity-90 text-white font-bold py-4 px-6 rounded-[16px] text-base transition-all shadow-rx-float"
          >
            <IconCamera className="w-5 h-5" />
            Scan your prescription
          </button>

          {/* Secondary CTA */}
          <button
            onClick={toggleSample}
            className="mt-2.5 w-full border-[1.5px] border-rx-pine-700 bg-rx-card text-rx-pine-700 font-bold py-3 px-6 rounded-[16px] text-sm transition-colors hover:bg-rx-pine-50 active:bg-rx-pine-50"
          >
            {showSample ? '← Hide sample' : 'See a sample result first'}
          </button>
        </section>

        {/* SAMPLE TOGGLE */}
        {showSample && (
          <section
            className={`mb-6 rounded-[20px] bg-rx-card border border-rx-hairline overflow-hidden transition-all duration-300 ease-in-out shadow-rx-card ${
              sampleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
          >
            <div className="bg-rx-hero-bg px-4 py-3.5 relative overflow-hidden">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-rx-mint opacity-[0.08] blur-2xl" />
              <p className="relative text-[11px] font-bold text-rx-mint uppercase tracking-[0.1em]">
                Sample prescription
              </p>
              <div className="relative flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-white">₹{totalSavings}</span>
                <span className="text-xs text-rx-cream-muted">potential savings on 4 meds</span>
              </div>
            </div>

            <div className="px-4 py-2">
              {SAMPLE_MEDICINES.map((m, i) => (
                <SampleMiniCard key={i} medicine={m} />
              ))}
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={onTrySample}
                className="w-full py-2.5 rounded-[12px] bg-rx-pine-700 hover:bg-rx-pine-900 text-white text-sm font-bold transition-colors"
              >
                See full results →
              </button>
            </div>
          </section>
        )}

        {/* STATS */}
        <StatBar />

        {/* HOW IT WORKS */}
        <section className="mt-2 mb-6">
          <h3 className="text-[11px] font-bold text-rx-ink-subtle uppercase tracking-[0.12em] mb-5 text-center">
            How it works
          </h3>
          <div className="space-y-4">
            <HowItWorksStep
              number={1}
              Icon={IconCamera}
              color={stepColors[0]}
              title="Snap"
              description="Take a photo of your handwritten prescription. Works with any doctor's handwriting."
            />
            <HowItWorksStep
              number={2}
              Icon={IconSpark}
              color={stepColors[1]}
              title="Read"
              description="AI identifies every medicine, dosage, and frequency — even from messy handwriting."
            />
            <HowItWorksStep
              number={3}
              Icon={IconCoin}
              color={stepColors[2]}
              title="Save"
              description="See generic alternatives with prices. Know exactly how much you can save."
            />
          </div>
        </section>

        {/* TRUST STRIP */}
        <TrustStrip />

        {/* EDUCATIONAL CAROUSEL */}
        <DidYouKnowCarousel />

        {/* FOOTER DISCLAIMER */}
        <div className="mt-8 text-center px-2">
          <p className="text-[11px] text-rx-ink-subtle leading-relaxed">
            RxScan helps you understand your prescription. It is not medical advice.
            Always confirm with your doctor or pharmacist before making any changes to your medication.
          </p>
          <p className="text-[11px] text-rx-ink-subtle mt-2 opacity-70">
            Data sourced from Jan Aushadhi and CDSCO public records
          </p>
        </div>
      </main>
    </div>
  );
}